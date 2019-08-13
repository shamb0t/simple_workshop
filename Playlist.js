import React, { useState, useEffect } from "react"
import { observer, Observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import DropZone from './DropZone.js'


const Playlist = (props) => {
  const [playlist, setPlaylist] = useState(null)
  const [items, setItems] = useState([])
  const [dragActive, setDragActive] = useState(false)

  let mounted = true
  const address = '/orbitdb/' + props.match.params.hash + '/' + props.match.params.name

  useEffect(handleChannelNameChange, [address])

  function handleChannelNameChange () {
    function load () {
      props.store.joinPlaylist(address).then(playlist => {
        if (mounted) {
          setPlaylist(playlist)
          setItems(playlist.all)
        }
      })
    }
    load()

    // reload when peer connected
    props.store._ipfs.libp2p.on('peer:connect', load)
    return () => {
      props.store._ipfs.libp2p.removeListener('peer:connect', load)
      mounted = false
    }
  }

    async function onDrop (event) {
       event.preventDefault()
       setDragActive(false)
       const files = []
       if (event.dataTransfer.items) {
         for (let i = 0; i < event.dataTransfer.items.length; i++) {
           const file = event.dataTransfer.items[i]
           file.kind === 'file' && files.push(file.getAsFile())
         }
       } else {
         for (let i = 0; i < event.dataTransfer.files.length; i++) {
           files.push(event.dataTransfer.files.item(i))
         }
       }
       try {
         const newItems = await store.sendFiles(files, address)
         // await playlist.load()
         setItems(items.concat(newItems.filter(x => x!== null && x!== undefined)))
       } catch (err) {
         console.log("ERROR", err)
         throw err
       }
    }

  return (
    <div onDragOver={event => {
            event.preventDefault()
            !dragActive && setDragActive(true)}
          }
          onDrop={event => onDrop(event)}>
      <div>{"ID: " + props.store.ipfsId}</div>
      <ul> {
          items.map(song => (
          <div key={song.hash}>
            <li>
              <Link to={`${song.hash}`}>{song.hash}</Link>
              <button>share</button>
              <button onClick={() => playlist.del(song.hash)}>delete</button>
            </li>
          </div>
        )
      )}
      </ul>
    </div>
  )
}

const PlaylistView = (props) => {
  return (
    <Observer>
    {() =>
      props.store.isOnline ? (
        <div className="PlaylistView">
          <div>
            <Link to={`/`}> Back </Link>
            <div>Songs</div>
          </div>
          <Playlist {...props} />
        </div>
      ) : null
    }
    </Observer>
  )
}
export default PlaylistView

// return (
//    <Observer>
//      {() =>
//        store.isOnline ? (
//          <div className="PlaylistView">
//
//            {/* Render the channel */}
//            <Channel channelName={props.match.params.channel} />
//          </div>
//        ) : null
//      }
//    </Observer>
//  )

//
// const Playlist = ({ store, location }) => {
//   const [playlist, setPlaylist] = useState(null)
//   const [items, setItems] = useState([])
//   const [address, setAddress] = useState(null)
//   const [dragActive, setDragActive] = useState(false)
//
//   async function load () {
//     const items = await store.openPlaylist(location.pathname)
//     setItems(items)
//     setAddress(location.pathname)
//   }
//
//   useEffect(() => {
//     load()
//     return () => {
//     }
//   }, [{store, location}])
//
//   async function onDrop (event) {
//      event.preventDefault()
//      setDragActive(false)
//      const files = []
//      if (event.dataTransfer.items) {
//        for (let i = 0; i < event.dataTransfer.items.length; i++) {
//          const file = event.dataTransfer.items[i]
//          file.kind === 'file' && files.push(file.getAsFile())
//        }
//      } else {
//        for (let i = 0; i < event.dataTransfer.files.length; i++) {
//          files.push(event.dataTransfer.files.item(i))
//        }
//      }
//      try {
//        const newItems = await store.sendFiles(files, address)
//        setItems(items.concat(newItems.filter(x => x!== null && x!== undefined)))
//      } catch (err) {
//        console.log("ERROR", err)
//        throw err
//      }
//   }
//
//   const Items = (props) => (
//     <ul> {
//       props.store.songs.map(song => (
//         <div key={song.name}>
//           <li>
//             <Link to={`${playlist.name}`}>{song.name}</Link>
//             <button>share</button>
//             <button onClick={() => props.store.deletePlaylist(playlist.name)}>delete</button>
//           </li>
//         </div>
//       )
//     )}
//     </ul>)
//
  // return (
  //     <div className="header">
  //       <Link to={`/`}> Back </Link>
  //       <div onDragOver={event => {
  //         event.preventDefault()
  //         !dragActive && setDragActive(true)}
  //       }
  //       label={"add files to " + address }
  //       onDragLeave={() => setDragActive(false)}
  //       onDrop={event => onDrop(event)}
  //       style={{height: "10em"}}>
  //     <Items className="items-list"/>
  //     </div>
  //   </div>
  // )
// }
//
// export default observer(Playlist)
