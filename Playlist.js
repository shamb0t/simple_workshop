import React, { useState, useEffect } from "react"
import { observer, Observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import DropZone from './DropZone.js'
import ReactPlayer from 'react-player'

function toArrayBuffer (buffer) {
  const ab = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return ab
}

const PlayAudio = ({ipfs, hash}) => {
  const [previewContent, setPreviewContent] = useState(null)
  useEffect (() => {
    getFileBuffer(ipfs, hash).then(buffer => {
      let blob = new Blob([])
      if (buffer instanceof Blob) {
        blob = buffer
      } else if (buffer) {
        blob = new Blob([toArrayBuffer(buffer)], { type: 'audio/mpeg' })
      }
      setPreviewContent(<audio src={window.URL.createObjectURL(blob)} controls autoPlay={false} />)
    })
  }, [hash])


  // const srcUrl = buffer ? window.URL.createObjectURL(blob) : url
  return previewContent ? previewContent : null
}

function getFileBuffer (ipfs, hash, options = {}) {
  const timeoutError = new Error('Timeout while fetching file')
  const timeout = options.timeout || 5 * 1000
  return new Promise((resolve, reject) => {
    let timeoutTimer = setTimeout(() => {
      reject(timeoutError)
    }, timeout)
    const stream = ipfs.catReadableStream(hash)
    let array = new Uint8Array(0)
    stream.on('error', error => {
      clearTimeout(timeoutTimer)
      reject(error)
    })
    stream.on('data', chunk => {
      clearTimeout(timeoutTimer)
      const tmp = new Uint8Array(array.length + chunk.length)
      tmp.set(array)
      tmp.set(chunk, array.length)
      array = tmp
      timeoutTimer = setTimeout(() => {
        reject(timeoutError)
      }, timeout)
    })
    stream.on('end', () => {
      console.log("FINITO")
      clearTimeout(timeoutTimer)
      resolve(array)
    })
  })
}

async function loadFile (hash) {
  const array = await getFileBuffer(ipfs, hash)
  return array
}

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
    // props.store._ipfs.libp2p.on('peer:connect', load)
    return () => {
      // props.store._ipfs.libp2p.removeListener('peer:connect', load)
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
              <li><PlayAudio ipfs={props.store._ipfs} hash={song.payload.value.content}/></li>
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
