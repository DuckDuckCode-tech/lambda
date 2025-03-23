import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "DDCTable";

export interface UserItem {
    pk: string;
    userId: string;
    email: string;
    name: string;
    avatarUrl: string;
    githubUsername: string;
}

export interface User {
    userId: string;
    email: string;
    name: string;
    avatarUrl: string;
    githubUsername: string;
}

export interface AccessTokenItem {
    pk: string;
    token: string;
    userId: string;
}

export interface AccessToken {
    token: string;
    userId: string;
}

export interface Chat {
    from: "user" | "website";
    message: string;
    createdAt: string;
}

export interface RepositoryItem {
    pk: string;
    userId: string;
    repositoryId: string;
    repositoryBranch: string;
    repositoryName: string;
    repositoryDescription: string;
    repositoryUrl: string;
    chats: Chat[];
}

export interface Repository {
    userId: string;
    repositoryId: string;
    repositoryBranch: string;
    repositoryName: string;
    repositoryDescription: string;
    repositoryUrl: string;
    chats: Chat[];
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
        };

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
                    pk: `USER#${userId}`
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
        };

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
                    pk: `TOKEN#${token}`
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

    public async createRepository(repository: Repository): Promise<void> {
        const item: RepositoryItem = {
            pk: `REPOSITORY#${repository.userId}#${repository.repositoryName}`,
            repositoryId: repository.repositoryId,
            userId: repository.userId,
            repositoryBranch: repository.repositoryBranch,
            repositoryName: repository.repositoryName,
            repositoryDescription: repository.repositoryDescription,
            repositoryUrl: repository.repositoryUrl,
            chats: repository.chats
        };

        const response = await this.ddbClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: item
            })
        );

        console.log("Repository created:", response);
    }

    public async getRepository(userId: string, repositoryName: string): Promise<RepositoryItem | null> {
        const response = await this.ddbClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    pk: `REPOSITORY#${userId}#${repositoryName}`
                }
            })
        );

        console.log(`Repository retrieved: ${JSON.stringify(response.Item)}`);

        return (response.Item as RepositoryItem | undefined) ?? null;
    }

    public async getRepositoriesForUser(userId: string): Promise<RepositoryItem[]> {
        const response = await this.ddbClient.send(
            new ScanCommand({
                TableName: TABLE_NAME,
                FilterExpression: "begins_with(pk, :pk)",
                ExpressionAttributeValues: {
                    ":pk": `REPOSITORY#${userId}#`
                }
            })
        );

        console.log(`Repositories retrieved for user ${userId}: ${JSON.stringify(response.Items)}`);

        return (response.Items as RepositoryItem[] | undefined) ?? [];
    }
}
