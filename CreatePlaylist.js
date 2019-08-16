import React, { Component, useState } from "react";
import './styles/CreatePlaylist.scss'

const CreatePlaylist = (props) => {
  const [name, setName] = useState('')

  async function handleSubmit (event) {
    event.preventDefault()
    const playlist = await props.store.createNewPlaylist(name)
    setName('')
    console.log("Created",playlist)
  }

  async function handleChange(event) {
    event.preventDefault();
    setName(event.target.value)
  }

  return(
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="New playlist" onChange={handleChange} />
      <input type="submit" value="Create" />
    </form>
  )
}

export default CreatePlaylist
