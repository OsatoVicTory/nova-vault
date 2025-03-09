export const getLineData = (data) => {
    const computeBg = () => {
        const ctx = document.createElement("canvas").getContext("2d");
        const grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, "rgba(58, 123, 213, 0.8)");
        grad.addColorStop(1, "rgba(0, 210, 255, 0.21)");
        return grad;
    };

    return [
        {
            data,
            label: "Staked amount",
            borderColor: "rgba(58, 123, 213, 0.5)", //"rgba(60, 207, 46, 0.5)",
            fill: true,
            backgroundColor: computeBg(),
            borderWidth: 1.5,
            pointBackgroundColor: "#fff" // for tooltip
        }
    ];
};

export const getBarData = (data) => {

    return [
        {
            data,
            minBarLength: 3,
            borderRadius: 10,
        }
    ];
};

export const bgObj = {
    "true": ['#25d366','rgba(58, 123, 213, 0.9)', 'rgba(240, 57, 57, 0.93)'],
    "false": ['rgba(0, 197, 0, 0.45)','rgba(58, 123, 213, 0.45)', 'rgba(240, 57, 57, 0.45)'],
};

export const getDoughnutData = (data = [500, 250]) => {    
    // const d_dataset = [{ data: [500, 250], backgroundColor: ['rgba(0, 197, 0, 0.33)', 'rgba(240, 57, 57, 0.33)'] }];
    return [
        { 
            data, 
            backgroundColor: ['rgba(58, 123, 213, 0.72)', 'rgba(255, 234, 0, 0.72)'],
            borderColor: "transparent"
        }
    ];
};

export const getNftDoughnutData = (data, mode = true) => {
    return [
        { 
            data, 
            backgroundColor: bgObj[mode+""],
            borderColor: "transparent"
        }
    ];
}