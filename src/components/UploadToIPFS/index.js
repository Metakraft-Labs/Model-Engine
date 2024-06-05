async function UploadToIpfs(file, type) {
    let cid = null;
    const handleSubmission = async () => {
        const uploadImage = async file => {
            try {
                const formData = new FormData();
                formData.append("file", file);
                const metadata = JSON.stringify({
                    name: "User's NFT Image",
                    type: type,
                });
                formData.append("pinataMetadata", metadata);

                const options = JSON.stringify({
                    cidVersion: 0,
                });
                formData.append("pinataOptions", options);

                const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.REACT_APP_JWT}`,
                    },
                    body: formData,
                });
                const resData = await res.json();
                cid = `ipfs://${resData.IpfsHash}`;
                return cid;
            } catch (error) {
                console.log(error);
            }
        };

        cid = await uploadImage(file);
    };

    await handleSubmission();

    return cid;
}

export default UploadToIpfs;
