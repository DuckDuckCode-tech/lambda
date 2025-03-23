import { Octokit } from "octokit";

export interface FileInformation {
    path: string;
    mode: "100644" | "100755" | "040000" | "160000" | "120000";
    type: "blob" | "tree" | "commit";
    sha?: string | null;
    content?: string;
}

export class GitService {
    private readonly octokit: Octokit;

    constructor(accessToken: string) {
        this.octokit = new Octokit({ auth: accessToken });
    }

    async getRef(owner: string, repo: string, ref: string) {
        return this.octokit.rest.git.getRef({ owner, repo, ref })
    }

    async getUserInformation() {
        const response = await this.octokit.rest.users.getAuthenticated();
        return response.data;
    }

    async getAllRepositories() {
        const response = await this.octokit.rest.repos.listForAuthenticatedUser({
            affiliation: "owner",
        });

        return response.data;
    }

    async getRepositoryInformation(owner: string, repositoryName: string) {
        const response = await this.octokit.rest.repos.get({
            owner: owner,
            repo: repositoryName
        });

        return response.data;
    }

    async createRef(owner: string, repo: string, ref: string, sha: string) {
        this.octokit.rest.git.createRef({ owner, repo, ref, sha })
    }

    async createBlob(owner: string, repositoryName: string, content: string, encoding: string) {
        const response = await this.octokit.rest.git.createBlob({
            owner,
            repo: repositoryName,
            content,
            encoding,
        });

        return response.data;
    }

    async createTree(owner: string, repositoryName: string, tree: FileInformation[], baseTreeSha: string) {
        return await this.octokit.rest.git.createTree({
            owner,
            repo: repositoryName,
            tree,
            base_tree: baseTreeSha
        });
    }

    async createCommit(
        owner: string,
        repositoryName: string,
        message: string,
        treeSha: string,
        parentShas: string[]
    ) {
        return await this.octokit.rest.git.createCommit({
            owner,
            repo: repositoryName,
            message,
            tree: treeSha,
            parents: parentShas
        });
    }

    async updateRef(owner: string, repositoryName: string, ref: string, sha: string) {
        await this.octokit.rest.git.updateRef({
            owner,
            repo: repositoryName,
            ref,
            sha
        });
    }

    async createPullRequest(
        owner: string,
        repositoryName: string,
        title: string,
        head: string,
        base: string,
        body: string
    ) {
        return await this.octokit.rest.pulls.create({
            owner,
            repo: repositoryName,
            title,
            head,
            base,
            body
        });
    }
}
