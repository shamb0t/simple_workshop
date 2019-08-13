import React from 'react'
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import CreatePlaylist from './CreatePlaylist'
import Popup from "reactjs-popup";

// const PopupExample = () => (
//   <Popup trigger={<button> Trigger</button>} position="right center">
//     <div>Popup content here !!</div>
//   </Popup>
// )

const Playlists = (props) =>
  props.store.isOnline ?
    (<div>
      <div>{"ID: " + props.store.ipfsId}</div>
      <CreatePlaylist store={props.store} />
      <ul> {
        props.store.playlists.map(playlist => (
          <div key={playlist.name}>
            <li>
              <Link to={`${playlist.address}`}>{playlist.name}</Link>
              <Popup trigger={<button> Share</button>} position="right center">
                <div>
                  <ul>
                    {props.store.peers.map(p => (
                      <li key={p}><button onClick={ () => props.store.sharePlaylist(playlist.address, p)}>{p}</button></li>
                    ))}
                  </ul>
                </div>
              </Popup>
              <button onClick={() => props.store.deletePlaylist(playlist.name)}>delete</button>
            </li>
          </div>
        )
      )}
      </ul>
    </div>) : null


export default observer(Playlists)
