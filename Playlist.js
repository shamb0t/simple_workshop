import React, { useState, useEffect } from "react"
import { observer, Observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import ReactPlayer from 'react-player'
import './styles/Playlist.scss'
import { getDataTransferFiles, toArrayBuffer, getFileBuffer } from './helper'

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
          playlist.events.on('replicate.progress', load)
          setItems(playlist.all)
        }
      })
    }
    load()

    // reload when peer connected
    // props.store._ipfs.libp2p.on('peer:connect', load)
    return () => {
      // props.store._ipfs.libp2p.removeListener('peer:connect', load)
      playlist.events.removeListener('replicate.progress', load)
      setPlaylist(null)
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
    <div className='Playlist'>
      <div className='header'>
        <Link to={`/`}> Back </Link>
        <div id='title'>{props.match.params.name}</div>
        <div id='ipfsId'>{"IPFS ID: " + props.store.ipfsId}</div>
      </div>
      <div className='dragZone'
          onDragOver={event => {
              event.preventDefault()
              !dragActive && setDragActive(true)
            }
          }
          onDrop={event => onDrop(event)}>
          <ul> {
            items.map(song => (
                <div key={song.hash}>
                  <li><PlayAudio className="plyr" ipfs={props.store._ipfs} hash={song.payload.value.content}/></li>
                </div>
              )
          )}
          </ul>
      </div>
    </div>
  )
}

const PlaylistView = (props) => {
  return (
    <Observer>
    {() =>
      props.store.isOnline ? (<Playlist {...props} />) : null
    }
    </Observer>
  )
}
export default PlaylistView
