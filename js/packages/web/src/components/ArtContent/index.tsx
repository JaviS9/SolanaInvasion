import React, { Ref, useCallback, useEffect, useState } from 'react';
import { Image } from 'antd';
import { MetadataCategory, MetadataFile } from '@oyster/common';
import { MeshViewer } from '../MeshViewer';
import { ThreeDots } from '../MyLoader';
import { useCachedImage, useExtendedArt } from '../../hooks';
import { Stream, StreamPlayerApi } from '@cloudflare/stream-react';
import { PublicKey } from '@solana/web3.js';
import { getLast } from '../../utils/utils';

const HACK_LOOKUP: Record<string, string> = {
  'https://arweave.net/DZQLWAoc6MhpGoooFMrFF5okwUUwp034mtyrkzdFGfg':
  '482677586108c3ffba33204d9dfd8562',
  'https://arweave.net/BPJbVgBUCwDLALLruex_5cmXvffXvcCwwweoiJ45BUM':
    '01c2892dc406033a0dfbaf4ab883e448',
  'https://arweave.net/__2eOiYv0w-2_ayLUxqiSBQZeC9z5qcJPbeSE657Dcw':
    '0af8af868293c5a6b6aad8ea2f9b985c',
  'https://arweave.net/0PiQ1Iybbp07nLXXj2w2OzmE2BA9VAxu_sBPUkfjCX8':
    'bd9fbed75d9d58dbd9520cdbb7a407ae',
  'https://arweave.net/yftUPSwuKEyfazIi_vfKCSE-JrghtDDKfTbq0d-dmJ4':
    'acd90bc0d6bd75565eca507fb69c7263',
  'https://arweave.net/9Dd_JTurpzTPiz1prvNpS-PexkahCLTeXLVXUIT0qbE':
    'd90b177c2f77eab0fd70dec688d12d72',
  'https://arweave.net/WNLzR36v80IS61yeWyPYstF3qacWDXcDmYLp-RldYFQ':
    '0cb4b80b5a668072c9f3a0a4224628f6',
  'https://arweave.net/PHEyKMsLA0AfjLt0UyGyOa9NBSgJuKT2wHxcPca-Qs8':
    'a2a5deeafed881d67aed547f7ffaa03d',
  'https://arweave.net/5A8KJmRh2qYBNFdO0ChgJ_0Jx0ZgOFSatU2ffJg4SrA':
    '3e5eadb976fab8fe7330a760941a960f',
};

const MeshArtContent = ({
  uri,
  animationUrl,
  className,
  style,
  files,
}: {
  uri?: string;
  animationUrl?: string;
  className?: string;
  style?: React.CSSProperties;
  files?: (MetadataFile | string)[];
}) => {
  const renderURL = files && files.length > 0 && typeof files[0] === 'string'  ? files[0] : animationUrl;
  const { isLoading } = useCachedImage(renderURL || '', true);

  if (isLoading) {
    return <CachedImageContent
      uri={uri}
      className={className}
      preview={false}
      style={{ width: 300, ...style }}/>;
  }
  const likelyVideo = (files || []).filter((f, index, arr) => {
    // TODO: filter by fileType
    return arr.length >= 2 ? index === 1 : index === 0;
  })[0];

  return <MeshViewer url={renderURL} className={className} style={style} />;
}

const CachedImageContent = ({
  uri,
  className,
  preview,
  style,
}: {
  uri?: string;
  className?: string;
  preview?: boolean;
  style?: React.CSSProperties;
}) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const { cachedBlob } = useCachedImage(uri || '');

  return <Image
      src={cachedBlob}
      preview={preview}
      wrapperClassName={className}
      loading="lazy"
      wrapperStyle={{ ...style }}
      onLoad={e => {
        setLoaded(true);
      }}
      placeholder={<ThreeDots />}
      {...(loaded ? {} : { height: 200 })}
    />
}

const VideoArtContent = ({
  className,
  style,
  files,
  uri,
  animationURL,
  active,
  width,
  height,
}: {
  className?: string;
  style?: React.CSSProperties;
  files?: (MetadataFile | string)[];
  uri?: string;
  animationURL?: string;
  active?: boolean;
  width?: number;
  height?: number;
}) => {
  const [playerApi, setPlayerApi] = useState<StreamPlayerApi>();

  const playerRef = useCallback(
    ref => {
      setPlayerApi(ref);
    },
    [setPlayerApi],
  );

  useEffect(() => {
    if (playerApi) {
      playerApi.currentTime = 0;
    }
  }, [active, playerApi]);

  const likelyVideo = (files || []).filter((f, index, arr) => {
    if(typeof f !== 'string') {
      return false;
    }

    // TODO: filter by fileType
    return arr.length >= 2 ? index === 1 : index === 0;
  })?.[0] as string;

  const content = (
    HACK_LOOKUP[likelyVideo] || likelyVideo && likelyVideo.startsWith('https://watch.videodelivery.net/') ? (
      <div className={`${className} square`} style={{ height, width }}>
        <Stream
          streamRef={(e: any) => playerRef(e)}
          src={HACK_LOOKUP[likelyVideo] || likelyVideo.replace('https://watch.videodelivery.net/', '')}
          loop={true}
          height={600}
          width={600}
          controls={false}
          videoDimensions={{
            videoHeight: 700,
            videoWidth: 400,
          }}
          autoplay={true}
          muted={true}
        />
      </div>
    ) : (
      <video
        className={className}
        playsInline={true}
        autoPlay={true}
        muted={true}
        controls={true}
        controlsList="nodownload"
        style={style}
        loop={true}
        poster={uri}
      >
        {likelyVideo && <source src={likelyVideo} type="video/mp4" style={style} />}
        {animationURL && <source src={animationURL} type="video/mp4" style={style} />}
        {files?.filter(f => typeof f !== 'string').map((f: any) => <source src={f.uri} type={f.type} style={style} />)}
      </video>
    )
  );



  return content;
};


export const ArtContent = ({
  category,
  className,
  preview,
  style,
  active,
  allowMeshRender,
  pubkey,

  uri,
  animationURL,
  files,
  height,
  width,
}: {
  category?: MetadataCategory;
  className?: string;
  preview?: boolean;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  ref?: Ref<HTMLDivElement>;
  active?: boolean;
  allowMeshRender?: boolean;
  pubkey?: PublicKey | string,
  uri?: string;
  animationURL?: string;
  files?: (MetadataFile | string)[];
}) => {
  const id = typeof pubkey === 'string' ? pubkey : pubkey?.toBase58() || '';

  const { ref, data } = useExtendedArt(id);

  if(pubkey && data) {
    files = data.properties.files;
    uri = data.image;
    animationURL = data.animation_url;
    category = data.properties.category;
  }

  animationURL = animationURL || '';

  const animationUrlExt = new URLSearchParams(getLast(animationURL.split("?"))).get("ext");

  if (allowMeshRender && (category === 'vr' || animationUrlExt === 'glb' || animationUrlExt === 'gltf')) {
    return <MeshArtContent
      uri={uri}
      animationUrl={animationURL}
      className={className}
      style={style}
      files={files}/>;
  }

  const content = category === 'video' ? (
    <VideoArtContent
      className={className}
      style={style}
      files={files}
      uri={uri}
      animationURL={animationURL}
      active={active}
      height={height}
      width={width}
    />
  ) : (
    <CachedImageContent uri={uri}
      className={className}
      preview={preview}
      style={style}/>
  );

  return <div ref={ref as any} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{content}</div>;
};
