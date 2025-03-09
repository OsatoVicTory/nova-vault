import { useState, useEffect } from "react";
import "./styles.css";
import { getTooltipPosition } from "../utils";

const ToolTip = ({ content }) => {
    const [txt, setTxt] = useState(false);
    const [dim, setDim] = useState({ 
        child: { width: '0px', height: "0px" }, 
        par: { width: "0px", height: "0px" }, arrow: "0px"
    });

    useEffect(() => {
        if(content.txt) {
            const txtEle = document.createElement("span");
            document.body.appendChild(txtEle);
            const fontSize = "15px";
            txtEle.innerText = content.txt;
            Object.assign(txtEle.style, {
                fontSize,
                display: "inline-block",
                height: "auto",
                width: "max-content",
                maxWidth: Math.min(window.innerWidth - 70, 400) + "px",
                wordBreak: "break-all",
                textAlign: content.center ? "center" : "",
                whiteSpace: "pre-wrap",
            });
            let { width, height } = txtEle.getBoundingClientRect();
            width += 10;
            height += 3;
            document.body.removeChild(txtEle);

            // console.log('yes', content.rect.width, width, content.txt);
            if(content.rect.width >= width - 10 && !content.ignoreEllipsis) return;

            // if text is not clipped with ellipsis
            // console.log(content, width, height, {...getTooltipPosition(width, height, content.rect)})

            setDim({
                child: {
                    width: width + "px",
                    height: height + "px",
                    textAlign: content.center ? "center" : "",
                    // lineHeight: fontSize + 0.1 + "px",
                    fontSize,
                },
                par: {
                    width: width + 30 + "px",
                    height: height + 25 + "px",
                    ...getTooltipPosition(width, height, content.rect),
                },
            });
            setTxt(true);
        } else {
            setDim({ 
                child: { width: '0px', height: "0px" }, 
                par: { width: "0px", height: "0px" }, arrow: '0px'
            });
            setTxt(false);
        }
    }, [JSON.stringify(content?.rect || {})]);

    return (
        <span className={`tooltip ${txt}`}>
            <div className={`_tool-tip_ ${txt}`} style={{...dim.par}}>
                <div className={`_tool-tip_arrow ${txt} ${dim?.par?.alignment}`} style={{left: dim?.par?.arrow}}></div>
                <span className={`tool-tip-txt-span ${txt} txt-white`} style={{...dim.child}}>
                    {content.txt}
                </span>
            </div>
        </span>
    );
};

export default ToolTip;