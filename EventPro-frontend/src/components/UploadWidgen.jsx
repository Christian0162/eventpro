import { useState } from "react";
import 'filepond/dist/filepond.min.css';
import { FilePond } from 'react-filepond';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

export default function UploadWidget({ type, setPicture, setId, setDoc, className, setError }) {

    const [files, setFiles] = useState([])

    const handleUpload = (url) => {
        if (type === 'id') {
            setId(prev => [...prev, url])
        }

        else if (type === 'doc') {
            setDoc(prev => [...prev, url])
        }

        else if (type === 'proof') {
            setPicture(prev => [...prev, url])
        }
        else {
            setPicture(url)
        }
    }

    return (
        <>
            <div className={`${className}`}>
                <FilePond
                    files={files}
                    onupdatefiles={setFiles}
                    allowMultiple={true}
                    maxFiles={2}
                    name="file"
                    className='filepond--wrapper bg-transparent'
                    labelIdle='Drag & Drop your picture'
                    server={{
                        url: 'https://api.cloudinary.com/v1_1/dyikt4p59/image/upload',
                        process: {
                            method: 'POST',
                            headers: {},
                            withCredentials: false,
                            onload: (response) => {
                                const res = JSON.parse(response);
                                console.log('Cloudinary URL:', res.secure_url);
                                handleUpload(res.secure_url)
                                return res.secure_url;
                            },
                            onerror: (response) => response.data,
                            ondata: (formData) => {
                                formData.append('upload_preset', 'ml_default');
                                return formData;
                            },
                        }
                    }}
                />
            </div>
        </>
    );
}
