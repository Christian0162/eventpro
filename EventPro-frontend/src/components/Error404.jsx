import NavBar from "./NavBar"
import { Link } from "react-router-dom"

export default function Error404({ user, userData }) {
    return (
        <>
            <div>

                <div className="absolute top-0 w-full bg-white">
                    <NavBar user={user} userData={userData} />
                </div>

                <div className="flex flex-col mt-35 items-center justify-center">
                    <span className="block font-bold text-blue-500 text-9xl">404</span>
                    <p className="text-4xl text-gray-800">Page not found</p>
                    <p className="text-lg text-gray-600 mt-5">
                        Oops! Looks like you've wandered off the map.
                    </p>
                    <img
                        src="https://i.imgur.com/qIufhof.png"
                        alt="Cute lost anime character"
                        className="w-48"
                    />
                </div>


            </div>
        </>
    )
}