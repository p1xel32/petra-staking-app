import { UserApproval, UserRejection, UserResponse } from '@aptos-labs/wallet-standard';
export declare function makeUserApproval<T>(args: T): UserApproval<T>;
export declare function makeUserRejection(): UserRejection;
export type MaybeAsync<T> = T | Promise<T>;
export declare function mapUserResponse<Src, Dst>(response: UserResponse<Src>, mapFn: (src: Src) => Dst): UserResponse<Dst>;
export declare function mapUserResponse<Src, Dst>(response: UserResponse<Src>, mapFn: (src: Src) => Promise<Dst>): Promise<UserResponse<Dst>>;
//# sourceMappingURL=UserResponse.d.ts.map