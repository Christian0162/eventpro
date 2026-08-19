import { useState } from "react"
import { Button, Dialog, DialogPanel } from "@headlessui/react"
import { X, Star, ThumbsUp, MessageSquare, Edit3 } from 'lucide-react'
import UploadWidget from "./UploadWidgen"
import LoadingOverlay from "./LoadingOverlay"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebase/firebase"

export const ShopBackgroundModal = ({ userData }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false)
  const [background, setBackground] = useState('')

  function open() {
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
  }

  const handleSubmit = async () => {
    setIsBackgroundLoading(true)
    try {
      await updateDoc(doc(db, "shops", userData.id), {
        supplier_background_image: background
      })
      console.log('asd')
    }
    catch (e) {
      console.error(e)
    }
    finally {
      setIsBackgroundLoading(false)
      close()
      setBackground('')
    }
  }

  return (
    <>
      <Button onClick={open} className={'transition-all right-4 flex items-center gap-3 duration-100 absolute z-50 top-4 hover:bg-blue-700 px-4 py-1 text-md rounded-md bg-blue-600 text-white '}>

        <Edit3 size={16} />
        Edit
      </Button>

      <Dialog open={isOpen} as='div' className={'z-50 relative focus:outline-none'} onClose={close}>
        <div className="fixed inset-0 bg-black/25 " />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-xl mt-18 rounded-2xl bg-white shadow-2xl duration-300 "
            >
              <div className='relative px-8 py-4 bg-gray-100 rounded-t-xl'>
                <button
                  onClick={close}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                >
                  <X size={20} className="text-gray-600" />
                </button>

                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-blue-600">
                    Update Background Image
                  </h2>
                </div>
              </div>

              <div className='p-8'>
                <UploadWidget className={'py-2'} setPicture={setBackground} />
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => handleSubmit()}
                    disabled={!background}
                    className={`transition-all duration-75 px-4 h-10 rounded-md text-white ${background ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300'
                      }`}
                  >
                    Submit
                  </button>
                </div>
                {isBackgroundLoading && (
                  <LoadingOverlay isLoading={isBackgroundLoading} message="Processing.." />
                )}
              </div>
            </DialogPanel>
          </div>
        </div >
      </Dialog >
    </>
  )
}