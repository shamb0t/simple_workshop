import React from 'react'
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import CreatePlaylist from './CreatePlaylist'
import { Button, Popup } from 'semantic-ui-react';
import './styles/Playlists.scss'

const PlaylitsItem =({ playlist, onClick }) => {
  return (
    <li>
      <Link to={`${playlist.address}`}>{playlist.name}</Link>
      <div className="close" onClick={onClick}>delete</div>
    </li>
  )
}

const Playlists = (props) =>
  props.store.isOnline ?
    (<div>
      <CreatePlaylist store={props.store} />
      <ul className="playlist-items"> {
        props.store.playlists.map(playlist => {
          return (<PlaylitsItem key={playlist.address} playlist={playlist} onClick={() => props.store.deletePlaylist(playlist.hash)} />)
        }
      )}
      </ul>
    </div>) : null


export default observer(Playlists)
