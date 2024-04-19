type GitServiceErrorType =
  | "NO_CREDENTIALS_PROVIDED"
  | "AUTH_FAILED_WITH_PROVIDED_CREDENTIALS"
  | "UNKNOWN_REMOTE_OPERATION_ERROR"
  | "COULD_NOT_FIND_CURRENT_VERSION"
  | "UNKNOWN_ERROR";

export class GitServiceError extends Error {
  declare name: GitServiceErrorType;

  constructor(type: GitServiceErrorType, message?: string) {
    super(message); // To set the message
    this.name = type;
    Object.setPrototypeOf(this, GitServiceError.prototype);
  }
}
