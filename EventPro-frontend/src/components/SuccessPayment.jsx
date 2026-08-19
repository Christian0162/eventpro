import { CheckCircle2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFetchTransactionById } from "../hooks/useTransaction";
import { useEffect, useMemo, useState } from "react";
import { useFetchContract } from "../hooks/useContract";
import { useFetchEvents } from "../hooks/useEvents";
import { useFetchSuppliers } from "../hooks/useSupplier";
import { lazy, Suspense } from "react";
import PageLoading from "./PageLoading";
import LoadingOverlay from "./LoadingOverlay";


export default function PaymentSuccess({ userData }) {

    const ContractModal = useMemo(() => lazy(() => import("./ContractModal")), []);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const { transactions, isLoading } = useFetchTransactionById(userData.id);
    const { contracts } = useFetchContract()
    const { events } = useFetchEvents()
    const { suppliers } = useFetchSuppliers()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedContract, setSelectedContract] = useState(null)

    const transaction_exist = useMemo(
        () => transactions.find(trans => trans.external_id === id),
        [transactions, id]
    );
    const selectedContracts = contracts.find(c => c.id === transactions[0]?.contract_id)
    const contractEvents = events.find(e => e.id === selectedContracts?.event_id)
    const contractSupplier = suppliers.find(s => s.id === selectedContracts?.supplier_id)

    console.log(contractSupplier)

    useEffect(() => {
        if (!isLoading) {
            if (transaction_exist?.length === 0) {
                navigate("/", { replace: true });
            }
        }
    }, [isLoading, transactions, navigate]);

    const openContractModal = (contract) => {
        setSelectedContract(contract)
        setIsModalOpen(true)
    };

    const closeContractModal = () => {
        setIsModalOpen(false)
        setSelectedContract(null)
    };

    if (isLoading) {
        return <PageLoading />
    }

    return (
        <>
            {isModalOpen && selectedContract && (
                <Suspense fallback={<LoadingOverlay isLoading={true} message="Pleasee waitt.." />}>
                    <ContractModal
                        isOpen={isModalOpen}
                        onClose={closeContractModal}
                        userData={userData}
                        event_id={selectedContract.event_id}
                        user_id={userData.id}
                        supplier_id={selectedContract.supplier_id}
                        eventData={selectedContract.eventData}
                        supplierData={selectedContract.supplierData}
                    />
                </Suspense>
            )}

            <div className="flex items-center justify-center py-[5rem]">
                <div className="bg-white shadow-lg rounded-2xl p-8 text-center max-w-md">
                    <CheckCircle2 className="w-16 h-16 text-blue-500 mx-auto" />

                    <h1 className="text-2xl font-bold mt-4 text-gray-800">
                        Payment Successful!
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Your payment for the contract has been successfully processed.
                    </p>

                    <div className="mt-10 flex gap-2 items-center justify-center">
                        {/* userData, event_id, supplier_id, eventData, supplierData, user_id */}
                        <a
                            href="/"
                            className="block border border-gray-300 text-sm hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
                        >
                            Back to Home
                        </a>
                        <button
                            onClick={() => openContractModal({
                                supplierData: contractSupplier,
                                eventData: contractEvents,
                                supplier_id: contractSupplier.id,
                                user_id: userData.id,
                                userData: userData,
                                event_id: contractEvents.id,
                            })}
                            className={'transition-all duration-100 hover:bg-blue-700 self-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white '}
                        >
                            View Contract
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
