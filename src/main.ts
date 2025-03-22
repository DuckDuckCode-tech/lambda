import { Context, Handler } from "aws-lambda";

export const handler: Handler = async (event: object, context: Context) => {
	console.log(`Received invocation with event: ${JSON.stringify(event)}`);
};

