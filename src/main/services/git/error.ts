type GitServiceErrorType =
  // Common errors for remote operations
  | "NO_CREDENTIALS_PROVIDED"
  | "AUTH_FAILED_WITH_PROVIDED_CREDENTIALS"
  | "UNKNOWN_REMOTE_OPERATION_ERROR"
  // Error specific to local/getCurrentVersion()
  | "COULD_NOT_FIND_CURRENT_VERSION"
  // Error specific to remote/pull_() functions
  | "ILLEGAL_PULL_OPERATION"
  // Generic error for a git service
  | "UNKNOWN_ERROR";

export class GitServiceError extends Error {
  declare name: GitServiceErrorType;

  constructor(type: GitServiceErrorType, message?: string) {
    super(message); // To set the message
    this.name = type;
    Object.setPrototypeOf(this, GitServiceError.prototype);
  }
}
