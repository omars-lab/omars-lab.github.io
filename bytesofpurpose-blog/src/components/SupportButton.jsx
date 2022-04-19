import React from 'react';

export const Support = ({children}) => (
    // https://www.paypal.com/donate?business=UQ2SHCNPFYBJY&amount=1&no_recurring=0&item_name=Support%20a%20Developer&currency_code=USD
    <form action="https://www.paypal.com/donate" method="post" target="_top">
        <input type="hidden" name="business" value="UQ2SHCNPFYBJY" />
        <input type="hidden" name="amount" value="1" />
        <input type="hidden" name="no_recurring" value="0" />
        <input type="hidden" name="item_name" value="Support a Developer" />
        <input type="hidden" name="currency_code" value="USD" />
        <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
        <img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
    </form>
);

