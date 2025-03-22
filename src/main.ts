import axios from "axios";
import * as tar from "tar";
import { Octokit } from "octokit";
import { DynamoDBService } from "./ddb.js";
import { Context, Handler } from "aws-lambda";
import { FileSystemService } from "./filesystem.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";

interface Payload {
    accessToken: string;
    repositoryName: string;
    repositoryBranch: string;
    userPrompt: string;
}

const GEMINI_API_KEY: string = "AIzaSyBlOAmmmwlejJV4fMu4UxMxSygIoE-RP20"

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
    // use Prompt class to get prompts
    // const result = await model.generateContent(payload.userPrompt)


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
};

