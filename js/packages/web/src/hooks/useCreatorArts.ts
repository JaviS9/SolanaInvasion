import { useMeta } from '../contexts';
import { PublicKey } from '@solana/web3.js';

export const useCreatorArts = (id?: PublicKey | string) => {
  const { metadata } = useMeta();
  const filtered = metadata.filter(m =>
    m.info.data?.creators
      ? m.info.data.creators.findIndex(c => c.address.toBase58() === id) >= 0
      : -1,
  );

  return filtered;
};
