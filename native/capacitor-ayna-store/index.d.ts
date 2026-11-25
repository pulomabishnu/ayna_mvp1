import type { PluginListenerHandle } from '@capacitor/core';

export interface StoreProduct {
  id: string;
  displayName: string;
  description: string;
  displayPrice: string;
  price: number;
  periodUnit: 'day' | 'week' | 'month' | 'year' | null;
  periodValue: number | null;
  introOffer: { displayPrice: string; paymentMode: 'freeTrial' | 'payAsYouGo' | 'payUpFront' | 'other'; periodUnit: string; periodValue: number; periodCount: number } | null;
  introEligible: boolean;
}
export interface SignedTransaction { jws: string; productId: string; transactionId: string; originalTransactionId: string }

export interface AynaStorePlugin {
  storefront(): Promise<{ countryCode: string | null }>;
  products(options: { ids: string[] }): Promise<{ products: StoreProduct[] }>;
  purchase(options: { id: string; appAccountToken?: string }): Promise<{ status: 'success' | 'pending' | 'cancelled' } & Partial<SignedTransaction>>;
  currentEntitlements(): Promise<{ transactions: SignedTransaction[] }>;
  restore(): Promise<{ transactions: SignedTransaction[] }>;
  finish(options: { transactionId: string }): Promise<{ finished: boolean }>;
  manageSubscriptions(): Promise<void>;
  addListener(event: 'transaction', fn: (t: SignedTransaction) => void): Promise<PluginListenerHandle>;
}
export declare const AynaStore: AynaStorePlugin;
