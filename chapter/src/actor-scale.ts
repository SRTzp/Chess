import type {PieceSymbol} from './engine/chess';
/** Stable across poses/tier rows. Weapon and wing extremes already fit the fixed atlas cells. */
export const actorScale:Record<PieceSymbol,number>={p:.74,n:.94,r:.84,b:.84,q:.98,k:.98};
