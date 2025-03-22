import axios from "axios";
import { Octokit } from "octokit";
import { DynamoDBService } from "./ddb.js";
import { Context, Handler } from "aws-lambda";
import { FileSystemService } from "./filesystem.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

interface Payload {
	accessToken: string;
	repositoryName: string;
	repositoryBranch: string;
	userPrompt: string;
}

export const handler: Handler = async (payload: Payload, context: Context) => {
	console.log(`Received invocation with event: ${JSON.stringify(payload)}`);

	const { accessToken, repositoryName, repositoryBranch, userPrompt } = payload;
	if (!accessToken || !repositoryName || !repositoryBranch || !userPrompt) {
		throw new Error("Missing required parameters");
	}

	const octokit = new Octokit({ auth: accessToken });
	const ddbClient = new DynamoDBClient();
	const ddbService = new DynamoDBService(ddbClient);

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
	await fileSystemService.createDirectory(tmpDir);

	console.log("Downloading tarball...");
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

	console.log("Saving tarball to disk...");
	const writer = fileSystemService.createWriteStream(tarballPath);
	await fileSystemService.pipeline(response.data, writer);

	console.log(`User found: ${JSON.stringify(user)}`);
};

