import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

/** Dependências do Firebase injetadas nos serviços (facilita testes com o emulador). */
export interface Deps {
  db: Firestore;
  auth: Auth;
}
