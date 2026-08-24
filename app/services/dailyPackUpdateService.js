module.exports = function(pool, env) {
    async function updatePulls() {
        pool.query(`UPDATE users SET daily_pack_opens = 5, pack_reset_date = CURRENT_DATE WHERE pack_reset_date < CURRENT_DATE;`)
        .then(result => {
            console.log("Daily pack opens reset.");
        })
        .catch(error => {
            console.error("Error resetting daily pack opens:", error);
        });
    }
    return {updatePulls};
};
