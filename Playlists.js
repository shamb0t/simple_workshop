import React from 'react'
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import CreatePlaylist from './CreatePlaylist'
import './styles/Playlists.scss'

const PlaylitsItem =({ playlist, onClick }) => {
  return (
    <li>
      <Link to={`${playlist.address}`}>{playlist.name}</Link>
      <div className="close" onClick={onClick}>❌</div>
    </li>
  )
}

const Playlists = (props) =>
  props.store.isOnline ?
    (<div style={{ maxWidth: "800px" }}>
      <CreatePlaylist store={props.store} />
      <ul className="playlist-items"> {
        props.store.playlists.map(playlist => {
          return (<PlaylitsItem
            key={playlist.address}
            playlist={playlist}
            onClick={() => props.store.deletePlaylist(playlist.hash)} />)
        }
      )}
      </ul>
    </div>) : null


export default observer(Playlists)
