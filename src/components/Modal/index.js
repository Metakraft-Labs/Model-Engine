import { Modal } from '@mui/material'
import React from 'react'

export default function StyledModal({ open, onClose, heading, subHeading, children }) {
  return (
    <Modal open={open} onClose={onClose}></Modal>
  )
}
