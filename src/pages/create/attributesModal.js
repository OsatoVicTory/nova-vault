import { useCallback, useEffect, useState } from "react";
import "./create.css";
import { AiOutlineClose } from "react-icons/ai";

const AttributesSelector = ({ closeModal }) => {

    const [fields, setFields] = useState([0]);
    const [margin, setMargin] = useState(false);

    const addMore = () => {
        setFields([...fields, 0]);
    };

    const removeData = (index) => {
        setFields([...fields.filter((field, idx) => idx !== index)]);
    };

    useEffect(() => {
        if(fields.length > 6) !margin && setMargin(true);
        else margin && setMargin(false);
    }, [fields.length, margin]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        const [n, index] = name.split("-");
        setFields((prev) => {
            const newArr = [...prev];
            newArr[index - 0] = { ...newArr[index - 0], [n]: value };
            return newArr;
        });
    }, []);

    const handleSave = () => {
        let res = ``;
        for(let i = 0; i < fields.length; i++) {
            const { type, name } = fields[i];
            if(!type) continue;
            res += `${type}:=${name||"--"}%x4`;
        }
        closeModal(res);
    };

    return (
        <div className="__Modal__Overlay__ Attributes_Sel">
            <div className="__Modal__Container__">
                <div className="Attributes_Selector">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button className="modal-close-btn pointer" onClick={() => closeModal()}>
                                <AiOutlineClose className="mcb-icon txt-white" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <h3 className="txt-white">Add Attributes</h3>
                            <p className="txt-white">Attributes to describe some key visible features of your asset</p>
                            <div className="attribute-selector-form w-full">
                                <div className="asf-grid">
                                    <div className="asfg-type"><span className="txt-white">Type</span></div>
                                    <div className="asfg-name"><span className="txt-white">Name</span></div>
                                </div>
                                {fields.map((val, idx) => (
                                    <div className="asf-grid field" key={`asfg-${idx}`}>
                                        <div className="asfg-type">
                                            <button className="pointer" onClick={() => removeData(idx)}>
                                                <AiOutlineClose className="asfgtb-icon txt-white" />
                                            </button>
                                            <input placeholder="E.g Background" className="txt-white"
                                            onChange={handleChange} name={`type-${idx}`} />
                                        </div>
                                        <div className="asfg-name">
                                            <input placeholder="E.g Blue" className="txt-white"
                                            onChange={handleChange} name={`name-${idx}`} />
                                        </div>
                                    </div>
                                ))}
                                <button className="asf-add-more-btn pointer txt-white"
                                onClick={() => addMore()}>Add more</button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-base">
                        <button className={`asf-btn pointer ${margin}`} onClick={handleSave}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttributesSelector;