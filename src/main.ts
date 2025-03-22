import { Context, Handler } from "aws-lambda";

interface Payload {
	userId: string;
	accessToken: string;
	githubUsername: string;
	repositoryName: string;
	userPrompt: string;
}

export const handler: Handler = async (event: object, context: Context) => {
	console.log(`Received invocation with event: ${JSON.stringify(event)}`);
};

