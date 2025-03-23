import path from "path";
import axios from "axios";
import * as tar from "tar";
import { Octokit } from "octokit";
import { DynamoDBService } from "./ddb.js";
import { Context, Handler } from "aws-lambda";
import { FileChange, FileSystemService } from "./filesystem.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prompt } from "./prompt.js";
import { GitService } from "./git.js";

interface Payload {
    accessToken: string;
    repositoryName: string;
    repositoryBranch: string;
    userPrompt: string;
}


const GEMINI_API_KEY: string = "AIzaSyBlOAmmmwlejJV4fMu4UxMxSygIoE-RP20"
const STRIP_MD_REGEXP: RegExp = /^```json\s*([\s\S]*?)\s*```$/gm

export const handler: Handler = async (payload: Payload, context: Context) => {
    console.log(`Received invocation with event: ${JSON.stringify(payload)}`);

    const { accessToken, repositoryName, repositoryBranch, userPrompt } = payload;
    if (!accessToken || !repositoryName || !repositoryBranch || !userPrompt) {
        throw new Error("Missing required parameters");
    }

    const octokit = new Octokit({ auth: accessToken });
    const ddbClient = new DynamoDBClient();
    const ddbService = new DynamoDBService(ddbClient);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const user = await ddbService.getUserFromAccessToken(payload.accessToken);
    if (!user) {
        throw new Error("User not found");
    }

    const userInfo = await octokit.rest.users.getAuthenticated();
    if (!userInfo) {
        throw new Error("User information not found");
    }

    const tmpDir = "/tmp/repo";
    const tarballPath = `${tmpDir}/${repositoryName}.tar.gz`;
    const fileSystemService = new FileSystemService();

    console.log("Cleaning up previous runs and setting up local file system");
    if (fileSystemService.existsSync(tmpDir)) fileSystemService.rmSync(tmpDir, { recursive: true, force: true });
    if (fileSystemService.existsSync(tarballPath)) fileSystemService.unlinkSync(tarballPath);
    await fileSystemService.createDirectory(`${tmpDir}/source`);

    console.log("Downloading tarball");
    const tarballUrl = `https://api.github.com/repos/${userInfo.data.login}/${repositoryName}/tarball/${repositoryBranch}`;
    const response = await axios({
        method: "get",
        url: tarballUrl,
        responseType: "stream",
        headers: {
            Authorization: `token ${accessToken}`,
            Accept: "application/vnd.github.v3.raw"
        }
    });
    console.log(`User found: ${JSON.stringify(user)}`);

    console.log("Saving tarball to disk");
    const writer = fileSystemService.createWriteStream(tarballPath);
    await fileSystemService.pipeline(response.data, writer);

    console.log("Extracting tarball");
    await tar.x({ file: tarballPath, cwd: `${tmpDir}/source`, strip: 1 });

    console.log("Getting all files in source directory");
    const sourceDir = path.join(tmpDir, "source");
    const allFiles = await fileSystemService.getAllFilepathsInDirectory(sourceDir);
    const relativePaths = allFiles.map(file => path.relative(sourceDir, file));
    console.log("All files:", relativePaths);

    console.log("Entering GEMINI first stage")
    const firstStagePrompt = Prompt.firstStagePrompt(payload.userPrompt, relativePaths)
    var result = await model.generateContent(firstStagePrompt)
    var responseText = result.response.text().replace(STRIP_MD_REGEXP, '$1').trim();
    var paths: string[] = JSON.parse(responseText)
    paths = paths.map((fpath) => path.join(sourceDir, fpath))
    const requestedFileContents = await fileSystemService.readFiles(paths)
    console.log("Relevant files", paths)

    console.log("Entering GEMINI second stage")
    const secondStagePrompt = Prompt.secondStagePrompt(payload.userPrompt, relativePaths, requestedFileContents)
    result = await model.generateContent(secondStagePrompt)
    responseText = result.response.text().replace(STRIP_MD_REGEXP, '$1').trim();
    const fileChanges: FileChange[] = JSON.parse(responseText)
    fileChanges.forEach((fileChange) => {
        fileChange.filePath = path.join(sourceDir, fileChange.filePath)
    })
    console.log("File changes to be written:", fileChanges)
    await fileSystemService.writeFiles(fileChanges)
    console.log("File changes have been written!")

    const owner = userInfo.data.login
    const repo = payload.repositoryName
    const branch = payload.repositoryBranch

    const gitService = new GitService(accessToken)

    console.log('Getting base tree SHA...');
    const { data: baseRef } = await gitService.getRef(owner, repo, `heads/${branch}`)

    console.log('Creating new branch...');
    const branchName = `gemini-changes-${Date.now()}`;
    await gitService.createRef(owner, repo, `refs/heads/${branchName}`, baseRef.object.sha);
    console.log('Creating blobs for changed files...');
    const tree: {
        path: string;
        mode: "100644" | "100755" | "040000" | "160000" | "120000";
        type: "blob" | "tree" | "commit";
        sha?: string | null;
        content?: string;
    }[] = await Promise.all(fileChanges.map(async ({ filePath, content }) => {

        const data = await gitService.createBlob(owner, repo, Buffer.from(content).toString('base64'), 'base64');

        console.log(`Created blob for file: ${filePath}`);
        return {
            path: path.relative(sourceDir, filePath),
            mode: '100644',
            type: 'blob',
            sha: data.sha,
        };
    }));

    console.log('Creating new tree...');
    const { data: newTree } = await gitService.createTree(owner, repo, tree, baseRef.object.sha);

    console.log('Creating commit...');
    const { data: newCommit } = await gitService.createCommit(owner, repo, `Gemini: ${payload.userPrompt.substring(0, 50)}`, newTree.sha, [baseRef.object.sha]);

    console.log('Updating branch reference...');
    await gitService.updateRef(owner, repo, `heads/${branchName}`, newCommit.sha);

    console.log('Creating pull request...');
    const { data: pr } = await gitService.createPullRequest(owner, repo, `Gemini: ${payload.userPrompt.substring(0, 50)}`, branchName, branch, `Automated changes for: ${payload.userPrompt}`);

    console.log('Pull request created:', pr.html_url);
};

