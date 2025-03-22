import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "DDCTable";

interface UserItem {
    userId: string;
    email: string;
    name: string;
}

interface AccessTokenItem {
    token: string;
    userId: string;
}

export class DynamoDBService {
    private readonly ddbClient: DynamoDBClient;

    constructor(ddbClient: DynamoDBClient) {
        this.ddbClient = ddbClient;
    }
    
    async createUser(userItem: UserItem): Promise<UserItem> {
        const response = await this.ddbClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: userItem
            })
        );

        console.log("User created:", response);

        return userItem;
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

    async createAccessToken(accessTokenItem: AccessTokenItem): Promise<AccessTokenItem> {
        const response = await this.ddbClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: accessTokenItem
            })
        );

        console.log("Access token created:", response);

        return accessTokenItem;
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