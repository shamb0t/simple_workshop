import React, { useState, useEffect } from "react"
import { observer, Observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import ReactPlayer from 'react-player'
import './styles/Playlist.scss'
import { getDataTransferFiles, toArrayBuffer, getFileBuffer } from './helper'

const PlayAudio = ({ipfs, hash}) => {
  const [content, setContent] = useState(null)
  useEffect (() => {
    getFileBuffer(ipfs, hash).then(buffer => {
      let blob = new Blob([])
      if (buffer instanceof Blob) {
        blob = buffer
      } else if (buffer) {
        blob = new Blob([toArrayBuffer(buffer)], { type: 'audio/mpeg' })
      }
      setContent(<audio src={window.URL.createObjectURL(blob)} controls autoPlay={true} />)
    })
  }, [hash])

  return content ? content : null
}

const Playlist = (props) => {
  const [playlist, setPlaylist] = useState(null)
  const [track, setTrack] = useState(null)
  // const [items, setItems] = useState([])
  const [dragActive, setDragActive] = useState(false)

  let mounted = true
  const address = '/orbitdb/' + props.match.params.hash + '/' + props.match.params.name

  useEffect(handlePlaylistNameChange, [address])

  function handlePlaylistNameChange () {
    function load () {
      props.store.joinPlaylist(address).then(playlist => {
        if (mounted) {
          setPlaylist(playlist)
        }
      })
    }
    load()

    if (playlist) {
      playlist.events.on('replicate.progress', playlist.load())
    }

    return () => {
      setPlaylist(null)
      mounted = false
    }
  }

  async function onDrop (event) {
     event.preventDefault()
     setDragActive(false)
     const files = getDataTransferFiles(event)
     try {
       await store.sendFiles(files, address)
       await playlist.load()
     } catch (err) {
       console.log("ERROR", err)
       throw err
     }
  }

  const PlaylistItem = ({ name, hash }) => {
    return (
      <div className='playlist-item' onClick={() => setTrack(hash)}>{name}</div>
    )
  }

  return (
    <div className='Playlist'>
      <div className='header'>
        <Link to={`/`}> Back </Link>
        <div id='title'>{props.match.params.name}</div>
      </div>
      {track ? (<PlayAudio className="plyr" ipfs={props.store._ipfs} hash={track}/>) : null}
      <div className='dragZone'
          onDragOver={event => {
              event.preventDefault()
              !dragActive && setDragActive(true)
            }
          }
          onDrop={event => onDrop(event)}>
          <ul> {
            playlist && playlist.all.map(item => (
              <PlaylistItem key={item.hash} name={item.payload.value.meta.name} hash={item.payload.value.content}/>
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
