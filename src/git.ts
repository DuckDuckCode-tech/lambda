import { Octokit } from "octokit";

export class GitService {
    private readonly octokit: Octokit;

    constructor(accessToken: string) {
        this.octokit = new Octokit({ auth: accessToken });
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

    async getRepositoryInformation(repositoryName: string) {
        const userInfo = await this.getUserInformation();

        const response = await this.octokit.rest.repos.get({
            owner: userInfo.login,
            repo: repositoryName
        });

        return response.data;
    }
}