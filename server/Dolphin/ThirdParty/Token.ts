import { ObjectId } from "mongodb";
import { generateKeyPairSync, publicEncrypt } from "crypto";
import MethodResult from "../MethodResult";

type TokenUseTypes = "api" | "oauth";

enum TokenPermissionFlagBits {
    None = 0,
    // API Permissions
    APILogin = 1 << 0, // Can Login with this token
    APIGetUserNames = 1 << 1, // Can get a list of usernames
    // OAuth Permissions
    OAuthVerifyUser = 1 << 2, // Can verify a user when they used the OAuth Login method on a third party site
    OAuthGetUser = 1 << 3, // Can get this user's information
}

interface IToken {
    /*
    unique Token string
    */
    token: string
    /*
    Time when token was created
    */
    created: string
    /*
    Time when token expires
    */
    expires: string
    /*
    Reason for token creation
    */
    reason: string
    /*
    User id of the user for whom the token was created
    */
    userId: ObjectId
    /*
    Admin who created the token
    */
    createdBy: ObjectId
    /*
    Use of the Token
    */
    useFor: TokenUseTypes
    /*
    Permissions of the token
    */
    permissions: number
    /*
    Public key of the token (Server -> Client)
    */
    publicKey?: string
}

class Token implements IToken {
  public token: string;
  public created: string;
  public expires: string;
  public reason: string;
  public userId: ObjectId;
  public createdBy: ObjectId;
  public useFor: TokenUseTypes;
  public permissions: number;
  public publicKey?: string;

  constructor(token: IToken) {
    this.token = token.token;
    this.created = token.created;
    this.expires = token.expires;
    this.reason = token.reason;
    this.userId = token.userId;
    this.createdBy = token.createdBy;
    this.useFor = token.useFor;
    this.permissions = token.permissions;
  }

  public genKeys(): MethodResult<string> {
    try {
      if (this.publicKey) {
        throw new Error("Public key already exists.");
      }

      const { publicKey, privateKey } = generateKeyPairSync("rsa", {
        modulusLength: 2048,
      });

      // Save the public key
      this.publicKey = publicKey.export({ format: "pem", type: "spki" }).toString("base64");

      // Export the private key as a string
      const privateKeyString = privateKey.export({ format: "pem", type: "pkcs8" }).toString("base64");

      return [privateKeyString, null];
    } catch (err: any) {
      return [undefined, err as Error];
    }
  }

  public encryptString(plainText: string): MethodResult<string> {
    try {
      if (!this.publicKey) {
        throw new Error("Public key is not available.");
      }

      const buffer = Buffer.from(plainText, "utf-8");
      const encryptedData = publicEncrypt(this.publicKey, buffer);
      const encryptedString = encryptedData.toString("base64");

      return [encryptedString, null];
    } catch (err) {
      return [undefined, err as Error];
    }
  }


  public hasPermission(permission: TokenPermissionFlagBits): boolean {
    return (this.permissions & permission) === permission;
  }
}

export default Token;
export {
  TokenUseTypes,
  TokenPermissionFlagBits,
  IToken
};
