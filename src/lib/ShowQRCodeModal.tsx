import { ModalRoot, showModal } from '@decky/ui'
import { QRCodeSVG } from 'qrcode.react'

const ShowQRCodeModal = (url: string) => {
  showModal(
    <ModalRoot>
      <QRCodeSVG style={{ margin: '0 auto 1.5em auto' }} value={url} marginSize={4} size={256} />
      <span style={{ textAlign: 'center', wordBreak: 'break-word' }}>{url}</span>
    </ModalRoot>,
    window
  )
}

export default ShowQRCodeModal
