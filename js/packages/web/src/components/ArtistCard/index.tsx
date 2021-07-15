import React, { useState } from 'react'
import { Card } from 'antd'

import { Artist } from '../../types'

import './index.less'
import { shortenAddress } from '@oyster/common'
import { MetaAvatar } from '../MetaAvatar';

export const ArtistCard = ({artist}: {artist: Artist}) => {

  return (
    <Card
      hoverable={true}
      className={`artist-card`}
      cover={<div style={{ 
        height: 180, 
        backgroundSize: 'cover',
        backgroundImage: `url('${artist.background}')` || `url('https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Atlanta_Braves_Insignia.svg/2560px-Atlanta_Braves_Insignia.svg.png')` 
      }} />}
    >
      <div>
        <MetaAvatar creators={[artist]} size={100} style={{ marginTop: -50 }} />
        <div className="artist-card-name">{artist.name || shortenAddress(artist.address || '')}</div>
        <div className="artist-card-description">{artist.about}</div>
      </div>
    </Card>
  )
}
