import React from "react";

const Metrics = ({total, movingOn, rejection}) => {
    return (
        <div>
            <h3>{total || 0} Applied</h3>
            <h3>{movingOn || 0} Moving on</h3>
            <h3>{rejection || 0} Rejected</h3>
        </div>
    );
}

export default Metrics