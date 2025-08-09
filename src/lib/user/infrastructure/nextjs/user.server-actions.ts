'use server';

import { SetUserRoleUseCase } from '../../application/set-user-role.use-case';
import { SyncUserRoleUseCase } from '../../application/sync-user-role.use-case';
import { FirestoreUserRepository } from '../persistence/firestore-user.repository';
import type { UserRole } from '../../domain/user.entity';

const userRepository = new FirestoreUserRepository();

type SetUserRoleParams = {
  uid: string;
  role: UserRole;
};

export async function setUserRoleAction(params: SetUserRoleParams, actorUid: string) {
  try {
    const useCase = new SetUserRoleUseCase(userRepository);
    await useCase.execute({ targetUid: params.uid, newRole: params.role, actorUid });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncUserRoleAction(uid: string) {
    try {
        const useCase = new SyncUserRoleUseCase(userRepository);
        await useCase.execute(uid);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
