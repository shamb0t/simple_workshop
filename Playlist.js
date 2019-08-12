import React, { useState, useEffect } from "react"
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import DropZone from './DropZone.js'

const Playlist = (props) => {
  const [playlist, setPlaylist] = useState(null)
  const [items, setItems] = useState(null)
  const [address, setAddress] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    async function load () {
      if (props.location.pathname) {
        console.log("OCAION", props.location.pathname)
        const items = await props.store.openPlaylist(props.location.pathname)
        setItems(items)
        setAddress(props.location.pathname)
      }
    }
    load()
  }, [props])

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
       const newItems = await props.store.sendFiles(files, address)
       setItems(items.concat(newItems.filter(x => x!== null && x!== undefined)))
     } catch (err) {
       console.log("ERROR", err)
       throw err
     }
  }

  const Items = (props) => (
    <ul>
      {items && items.map(p => (
        <div className="item" key={p.hash}>
            <li>{p.data.meta.name}</li>
        </div>
      ))}
    </ul>)

  return (
    <div onDragOver={event => {
      event.preventDefault()
      !dragActive && setDragActive(true)}
    }>
      <div className="header"><Link to={`/`}> Back </Link>songs</div>
      <DropZone
        label={"add files to " + address }
        onDragLeave={() => setDragActive(false)}
        onDrop={event => onDrop(event)}
        style={{height: "10em"}}
      />
      <Items className="items-list" store={props.store}/>
    </div>
  )
}

export default observer(Playlist)
