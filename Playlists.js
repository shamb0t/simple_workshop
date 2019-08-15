import React from 'react'
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import CreatePlaylist from './CreatePlaylist'
import { Button, Popup } from 'semantic-ui-react';
import './Playlists.scss'

const Playlists = (props) =>
  props.store.isOnline ?
    (<div>
      <div>{"ID: " + props.store.ipfsId}</div>
      <CreatePlaylist store={props.store} />
      <ul className="playlist-items"> {
        props.store.playlists.map(playlist => (
          <li>
            <Link to={`${playlist.address}`}>{playlist.name}</Link>
            <Popup className='popup' content={
              (<div>
                <ul>
                  {[new Set(props.store.peers)].map(p => (
                    <li key={p}><div className="close" onClick={ () => props.store.sharePlaylist(playlist.address, p)}>{p}</div></li>
                  ))}
                </ul>
            </div>)
          } trigger={<div className="close"> Share</div>} position="top right">

            </Popup>
            <div className="close" onClick={() => props.store.deletePlaylist(playlist.name)}>delete</div>
          </li>
        )
      )}
      </ul>
    </div>) : null


export default observer(Playlists)
