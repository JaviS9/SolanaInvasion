import React, { useState } from 'react';
import { Avatar } from 'antd';
import { Artist } from '../../types';
import { Identicon } from '@oyster/common';

const MetaAvatarItem = (props: {
  creator: Artist,
  size: number,
  alt?: string,
  style?: React.CSSProperties,
}) => {
  const { creator, size, alt, style } = props;
  const [noImage, setNoImage] = useState(false);
  const image = creator.image || '';

  return (<Avatar alt={alt} size={size} style={style} src={noImage ? <Identicon alt={alt} address={creator.address} style={{ width: size }} /> : image} onError={() => {
    setNoImage(true);
    return false;
  }} /> );
}

export const MetaAvatar = (props: {
  creators?: Artist[],
  showMultiple?: boolean,
  size?: number,
  style?: React.CSSProperties,
}) => {
  const {
    creators,
    showMultiple,
    style,
  } = props;
  let size = props.size || 32;

  if(!creators || creators.length === 0) {
    return <Avatar size={size} src={false} />;
  }

  let controls = (creators || []).map(creator => (<MetaAvatarItem creator={creator} alt={creator.name} size={size} style={style} />));

  if(!showMultiple) {
    return controls[0];
  }

  return <Avatar.Group>{controls || null}</Avatar.Group>;
};
