import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Context, Handler } from "aws-lambda";
import { DynamoDBService } from "./ddb.js";

interface Payload {
	accessToken: string;
	repositoryName: string;
	repositoryBranch: string;
	userPrompt: string;
}

export const handler: Handler = async (payload: Payload, context: Context) => {
	console.log(`Received invocation with event: ${JSON.stringify(payload)}`);

	const ddbClient = new DynamoDBClient();
	const ddbService = new DynamoDBService(ddbClient);

	const user = await ddbService.getUserFromAccessToken(payload.accessToken);
	if (!user) {
		throw new Error("User not found");
	}
	console.log(`User found: ${JSON.stringify(user)}`);
};

