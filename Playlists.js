import React from 'react'
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import CreatePlaylist from './CreatePlaylist'

const Playlists = (props) => {
  return (
    <div>
      <CreatePlaylist store={props.store} />
      <ul> {
        props.store.playlists.map(playlist => (
          <div key={playlist.name}>
            <li>
              <Link to={`${playlist.address}`}>{playlist.name}</Link>
              <button>share</button>
              <button onClick={() => props.store.deletePlaylist(playlist.name)}>delete</button>
            </li>
          </div>
        )
      )}
      </ul>
    </div>
  )
}

export default observer(Playlists)
