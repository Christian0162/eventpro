import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Star, BadgeCheck, Badge } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { useFetchUserProfileById, useFetchUserProfiles } from '../hooks/useProfile';
import { useFetchReviews } from '../hooks/useReviews';
import { formatDistanceToNow } from 'date-fns';
import { useFetchUsers } from '../hooks/useUsers';
import ProfileHover from '../components/ProfileHover';
import PageLoading from '../components/PageLoading';
import { Title } from 'react-head';

export default function Profile({ userData }) {

    const [descriptionEditing, setDescriptionEditing] = useState(false)
    const [descriptionLoading, setDescriptionLoading] = useState(false)
    const [error, setError] = useState("");
    const [contactInformationEditing, setContactInformationEditing] = useState(false)
    const [contactInformationLoading, setContactInformationLoading] = useState(false)
    const [contact_number, setContact_number] = useState('')
    const [description, setDescription] = useState('')
    const { userProfile } = useFetchUserProfileById(userData?.id)
    const { userProfiles, isLoading: isUserProfileLoading } = useFetchUserProfiles()
    const { reviews } = useFetchReviews()
    const { users, isLoading: isUserLoading } = useFetchUsers()
    const [hoveredReviewerId, setHoveredReviewerId] = useState(null);

    const userReviews = reviews.filter(rev => rev.reviewed_id === userData?.id)

    const isAllLoading = isUserLoading || isUserProfileLoading

    const StarRating = ({ rating }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating
                            ? 'fill-orange-400 text-orange-400'
                            : 'text-gray-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    useEffect(() => {

        setContact_number(userProfile?.contact_number)
        setDescription(userProfile?.description)

    }, [userProfile])

    const handleDescription = async (e) => {
        e.preventDefault()
        setDescriptionLoading(true)

        try {
            await updateDoc(doc(db, "userProfiles", userData.id), {
                description: description
            })
        }

        catch (e) {
            console.error(e)
        }

        finally {
            setDescriptionLoading(false)
            setDescriptionEditing(false)
        }
    }

    return (
        <>
            {isAllLoading && (
                <PageLoading />
            )}
            {!isAllLoading && (
                <>
                <Title>Profile</Title>
                    <div className="max-w-7xl mx-auto bg-white border border-gray-200 shadow-xl rounded-md p-5">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                {userProfile.profile_pic ? (
                                    <img src={userProfile.profile_pic} alt="" className='h-20 w-20 rounded-full object-cover' />
                                ) : (
                                    <div className='text-5xl h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-pink-600 text-white flex items-center justify-center'><span>{userData.first_name.charAt(0).toUpperCase()}</span></div>
                                )}                    <div>
                                    <div className='flex items-center gap-2'>
                                        <h1 className="text-2xl font-bold text-gray-900 capitalize">{userData.first_name}</h1>
                                        {userData.verification_status === 'verified' && (
                                            <BadgeCheck className='text-blue-600 mt-1' />
                                        )}
                                    </div>
                                    <p className="text-md text-gray-500">{userData.role}</p>
                                </div>
                            </div>
                            {(userData.verification_status === 'unverified' || userData.verification_status === 'rejected') && userData.role === "Event Planner" && (
                                <a href={'/verify'} className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
                                    Verify
                                </a>
                            )}

                            {userData.verification_status === "pending" && (
                                <span className="flex group items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2">
                                    <span className={`text-yellow-700 font-medium text-sm`}>Pending</span>
                                </span>
                            )}
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Description Section */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-lg font-semibold text-gray-900 mt-2 ml-1">Description</h2>
                                    <button type='button' onClick={() => setDescriptionEditing(!descriptionEditing)} className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
                                        {descriptionEditing ? 'Cancel' : 'Edit'}
                                    </button>
                                </div>
                                {!descriptionLoading && (
                                    <form className='flex flex-col' onSubmit={handleDescription}>
                                        <textarea
                                            className={`w-full p-3 rounded-lg bg-gray-50 text-gray-700 resize-none ${descriptionEditing ? 'border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent' : 'border border-gray-300'} `}
                                            rows="3"
                                            disabled={!descriptionEditing}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Write a brief description of what you do."
                                            value={description}
                                        />
                                        {descriptionEditing && (
                                            <button className='px-7 py-2 mt-5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors self-center'>Save</button>
                                        )}
                                    </form>
                                )}

                                {descriptionLoading && (
                                    <div className='flex justify-center items-center h-30'>
                                        <div className='h-10 w-10 border-t border-blue-600 animate-spin rounded-full'></div>
                                    </div>
                                )}
                            </div>

                            {/* Contact Information Section */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address:
                                        </label>
                                        <input
                                            type="email"
                                            value={userData.email_address}
                                            disabled
                                            className={`w-full p-3 rounded-lg bg-gray-50 text-gray-700 der-blue-600 border border-gray-300`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Contact Number:
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={contact_number}
                                            disabled={!contactInformationEditing}
                                            maxLength={11}
                                            placeholder="e.g. 09487623432"
                                            className={`w-full p-3 rounded-lg bg-gray-50 text-gray-700 border border-gray-300`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {userData?.role !== "Admin" && (
                                <>
                                    {/* Recent Reviews Section */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h2>

                                        <div className="space-y-4">
                                            {userReviews.map((review, index) => {
                                                const reviewerProfile = userProfiles.find(
                                                    profile => profile.id === review.user_id
                                                )
                                                const reviewerDetail = users.find(user => user.id === review.user_id)

                                                return (
                                                    < div key={review.id} >
                                                        <div className="flex items-start gap-3">
                                                            {reviewerProfile?.profile_pic ? (
                                                                <img
                                                                    src={reviewerProfile?.profile_pic}
                                                                    alt=""
                                                                    className="h-10 w-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="text-5xl h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-pink-600 text-white flex items-center justify-center">
                                                                    <span className='block text-2xl'>{reviewerDetail?.first_name.charAt(0).toUpperCase()}</span>
                                                                </div>
                                                            )}

                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div
                                                                            className="relative inline-block"
                                                                            onMouseEnter={() => setHoveredReviewerId(review.id)}
                                                                            onMouseLeave={() => setHoveredReviewerId(null)}
                                                                        >
                                                                            <div className='flex flex-col'>
                                                                                <div className='flex items-baseline gap-3 mb-1'>
                                                                                    <h2 className="font-medium text-gray-900 cursor-pointer">
                                                                                        {reviewerDetail?.first_name} {reviewerDetail?.last_name}
                                                                                    </h2>
                                                                                    <p className="text-xs text-gray-500">{review?.created_at ? formatDistanceToNow(new Date(review.created_at.seconds * 1000), { addSuffix: true }) : 'Recent'}</p>
                                                                                </div>
                                                                                <h2 className="font-medium text-xs text-gray-600 cursor-pointer">
                                                                                    {reviewerDetail?.role === "Event Planner" ? 'Event' : 'Shop'}: {review.reviewer_name}
                                                                                </h2>
                                                                            </div>
                                                                            {hoveredReviewerId === review.id && (
                                                                                <ProfileHover hoveredReviewer={reviewerProfile} user={reviewerDetail} review={review} />
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <StarRating rating={review.rating} />
                                                                </div>

                                                                <p className="text-sm text-gray-900 mt-2">{review.comment}</p>
                                                            </div>
                                                        </div>


                                                        {index < userReviews.length - 1 && (
                                                            <hr className="my-4 border-gray-200" />
                                                        )}


                                                    </div>
                                                )
                                            })}

                                            {userReviews.length === 0 && (
                                                <h4 className='py-4 text-center text-gray-400 font-medium'>
                                                    No reviews yet
                                                </h4>
                                            )}

                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div >
                </>
            )
            }
        </>
    );
};

