import React from 'react'
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import CreatePlaylist from './CreatePlaylist'
import { Button, Popup } from 'semantic-ui-react';
import './styles/Playlists.scss'

const PlaylitsItem =({ playlist, store }) => {
  return (
    <li>
      <Link to={`${playlist.address}`}>{playlist.name}</Link>
      <Popup className='popup' content={
        (<div>
          <ul>
            {[new Set(store.peers)].map(p => (
              <li key={p}><div className="close" onClick={ () => props.store.sharePlaylist(playlist.address, p)}>{p}</div></li>
            ))}
          </ul>
      </div>)
    } trigger={<div className="close">share</div>} position="top right"/>
      <div className="close" onClick={() => store.deletePlaylist(playlist.name)}>delete</div>
    </li>
  )
}

const Playlists = (props) =>
  props.store.isOnline ?
    (<div>
      <div>{"IPFS ID: " + props.store.ipfsId}</div>
      <CreatePlaylist store={props.store} />
      <ul className="playlist-items"> {
        props.store.playlists.all.map(entry => {
          const playlist = entry.payload.value
          return (<PlaylitsItem key={playlist.address} playlist={playlist} store={props.store}/>)
      }
      )}
      </ul>
    </div>) : null


export default observer(Playlists)
