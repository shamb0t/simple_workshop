import React, { useState, useEffect } from "react"
import { observer, Observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import ReactPlayer from 'react-player'
import './styles/Playlist.scss'
import { getDataTransferFiles, toArrayBuffer } from './helper'

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

  return previewContent ? previewContent : null
}

function getFileBuffer (ipfs, hash, options = {}) {
  const timeoutError = new Error('Timeout while fetching file')
  const timeout = options.timeout || 15 * 1000
  return new Promise((resolve, reject) => {
    let timeoutTimer = setTimeout(() => {
      reject(timeoutError)
    }, timeout)

    let array = new Uint8Array(0)
    const stream = ipfs.catReadableStream(hash)
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
      clearTimeout(timeoutTimer)
      resolve(array)
    })
  })
}

const Playlist = (props) => {
  const [playlist, setPlaylist] = useState(null)
  const [items, setItems] = useState([])
  const [dragActive, setDragActive] = useState(false)

  let mounted = true
  const address = '/orbitdb/' + props.match.params.hash + '/' + props.match.params.name

  useEffect(handlePlaylistNameChange, [address])

  function handlePlaylistNameChange () {
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
     const files = getDataTransferFiles(event)
     try {
       const newItems = await store.sendFiles(files, address)
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
      <div>{"IPFS ID: " + props.store.ipfsId}</div>
      <ul> {
          items.map(song => (
            <div key={song.hash}>
              <li><PlayAudio className="plyr" ipfs={props.store._ipfs} hash={song.payload.value.content}/></li>
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
