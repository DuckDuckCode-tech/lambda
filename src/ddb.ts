import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "DDCTable";

interface UserItem {
    pk: string;
    userId: string;
    email: string;
    name: string;
}

interface User {
    userId: string;
    email: string;
    name: string;
}

interface AccessTokenItem {
    pk: string;
    token: string;
    userId: string;
}

interface AccessToken {
    token: string;
    userId: string;
}

export class DynamoDBService {
    private readonly ddbClient: DynamoDBClient;

    constructor(ddbClient: DynamoDBClient) {
        this.ddbClient = ddbClient;
    }
    
    async createUser(user: User): Promise<void> {
        const item: UserItem = {
            pk: `USER#${user.userId}`,
            userId: user.userId,
            email: user.email,
            name: user.name
        }

        const response = await this.ddbClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: item
            })
        );

        console.log("User created:", response);
    }

    async getUser(userId: string): Promise<UserItem | null> {
        const response = await this.ddbClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { userId }
            })
        );

        console.log("User retrieved:", response);

        return (response.Item as UserItem | undefined) ?? null;
    }

    async createAccessToken(accessToken: AccessToken): Promise<void> {
        const item: AccessTokenItem = {
            pk: `TOKEN#${accessToken.token}`,
            token: accessToken.token,
            userId: accessToken.userId
        }

        const response = await this.ddbClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: item
            })
        );

        console.log("Access token created:", response);
    }

    async getAccessToken(token: string): Promise<AccessTokenItem | null> {
        const response = await this.ddbClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { token }
            })
        );

        console.log("Access token retrieved:", response);

        return (response.Item as AccessTokenItem | undefined) ?? null;
    }
}