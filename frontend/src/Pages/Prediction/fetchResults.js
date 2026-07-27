// Author: Naveen Duhan
import axios from 'axios';
import { env } from 'env';

function formDataToJSON(formData) {
    const jsonObject = {};
    formData.forEach((value, key) => {
        if (jsonObject[key]) {
            if (!Array.isArray(jsonObject[key])) {
                jsonObject[key] = [jsonObject[key]];
            }
            jsonObject[key].push(value);
        } else {
            jsonObject[key] = value;
        }
    });
    return jsonObject;
}

export const fetchResults = async (mdata) => {
    const mmdata = formDataToJSON(mdata);
    const res = await axios.post(`${env.BACKEND}/api/jobs`, mmdata, {});
    return res.data;
};
