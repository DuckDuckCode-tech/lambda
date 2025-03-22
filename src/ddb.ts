import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "DDCTable";

interface UserItem {
    pk: string;
    userId: string;
    email: string;
    name: string;
    avatarUrl: string;
    githubUsername: string;
}

interface User {
    userId: string;
    email: string;
    name: string;
    avatarUrl: string;
    githubUsername: string;
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
    
    public async createUser(user: User): Promise<void> {
        const item: UserItem = {
            pk: `USER#${user.userId}`,
            userId: user.userId,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            githubUsername: user.githubUsername
        }

        const response = await this.ddbClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: item
            })
        );

        console.log("User created:", response);
    }

    public async getUser(userId: string): Promise<UserItem | null> {
        const response = await this.ddbClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    "pk": `USER#${userId}`
                }
            })
        );
        console.log(`User retrieved: ${JSON.stringify(response.Item)}`);

        return (response.Item as UserItem | undefined) ?? null;
    }

    public async createAccessToken(accessToken: AccessToken): Promise<void> {
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

    public async getAccessToken(token: string): Promise<AccessTokenItem | null> {
        const response = await this.ddbClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    "pk": `TOKEN#${token}`
                }
            })
        );

        console.log(`Access token retrieved: ${JSON.stringify(response.Item)}`);

        return (response.Item as AccessTokenItem | undefined) ?? null;
    }

    public async getUserFromAccessToken(token: string): Promise<UserItem | null> {
        const tokenItem = await this.getAccessToken(token);
        if (!tokenItem) {
            console.log("Access token not found:", token);
            return null;
        }

        const userItem = await this.getUser(tokenItem.userId);
        if (!userItem) {
            console.log("User not found for access token:", tokenItem.userId);
            return null;
        }

        return userItem;
    }
}