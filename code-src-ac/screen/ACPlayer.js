import { NONE } from '../common/constants/CursorColor.js';
import {
    BULLET_HOLE,
    PHONE_CONNECTED,
    MEDAL
} from '../../code-gen-ac/screen/SubImage.js';

export default class ACPlayer {
    constructor(device_id, nickname, uid) {
        /** @type {number} */
        this.device = device_id;
        /** @type {boolean} */
        this.calibrated = false;
        /**
         * value from CursorColor.NONE to CursorColor.VIOLET [-1..7]
         * @type {number}
         */
        this.color = NONE;
        /** @type {Color} */
        this.colorRef = undefined;
        /** @type {string} */
        this.name = nickname;
        /** @type {string} */
        this.uid = uid;
        /** @type {Image} */
        this.img = undefined;

        /** @type {number} */
        this.cursor = undefined;
        /** @type {number} */
        this.bulletHole = BULLET_HOLE;
        /** @type {number} */
        this.phone = PHONE_CONNECTED;
        /** @type {number} */
        this.x = 0;
        /** @type {number} */
        this.y = 0;

        /** @type {number} */
        this.medal = MEDAL;
        /** @type {number} */
        this.won = 0;
        this.roundWinner = false;
        this.lastRoundWinner = false;
        this.roundWinningStreak = 0;

        const buffer = new ArrayBuffer(102);

        this.cursorViewLow = new Float32Array(buffer, 0, 12);
        this.flagViewLow = new Uint8Array(buffer, 48, 2);

        this.cursorViewHigh = new Float32Array(buffer, 52, 12);
        this.flagViewHigh = new Uint8Array(buffer, 100, 2);

        this.dataViewLow = new Uint8Array(buffer, 0, 48);
        this.dataViewHigh = new Uint8Array(buffer, 52, 48);

        this.currentLow = true;
        this.currentFrame = 0;
        this.lastSetLow = true;
        this.lastFlagSetLow = true;
        this.buffering = false;

        Object.seal(this);
    }

    setData(buffer) {
        if (this.currentLow) {
            this.setDataHigh(buffer);
        } else {
            this.setDataLow(buffer);
        }

        if (this.lastFlagSetLow) {

            // now set high flag!

            if (this.flagViewHigh[0] != 0) { // high flag still set
                if (buffer[48] != 0) { // buffer flag value exists
                    if (this.flagViewLow[0] != 0) { // alt (low) flag also set
                        console.warn(`device:${this.device} (${this.name}) overwriting btn flag 0 (high)`);
                        this.flagViewHigh[0] = buffer[48]; // overwrite existing flag data
                    } else {
                        this.flagViewLow[0] = buffer[48];
                    }
                }
            } else {
                this.flagViewHigh[0] = buffer[48]; // normal case, just set high flag
            }

            if (this.flagViewHigh[1] != 0) { // high flag still set
                if (buffer[49] != 0) { // buffer flag value exists
                    if (this.flagViewLow[1] != 0) { // alt (low) flag also set
                        console.warn(`device:${this.device} (${this.name}) overwriting btn flag 1 (high)`);
                        this.flagViewHigh[1] = buffer[49]; // overwrite existing flag data
                    } else {
                        this.flagViewLow[1] = buffer[49];
                    }
                }
            } else {
                this.flagViewHigh[1] = buffer[49]; // normal case, just set high flag
            }

            this.lastFlagSetLow = false;

        } else {

            // now set low flag

            if (this.flagViewLow[0] != 0) { // low flag still set
                if (buffer[48] != 0) { // buffer flag value exists
                    if (this.flagViewHigh[0] != 0) { // alt (high) flag also set
                        console.warn(`device:${this.device} (${this.name}) overwriting btn flag 0 (low)`);
                        this.flagViewLow[0] = buffer[48]; // overwrite existing flag data
                    } else {
                        this.flagViewHigh[0] = buffer[48];
                    }
                }
            } else {
                this.flagViewLow[0] = buffer[48]; // normal case, just set low flag
            }

            if (this.flagViewLow[1] != 0) { // low flag still set
                if (buffer[49] != 0) { // buffer flag value exists
                    if (this.flagViewHigh[1] != 0) { // alt (high) flag also set
                        console.warn(`device:${this.device} (${this.name}) overwriting btn flag 1 (low)`);
                        this.flagViewLow[1] = buffer[49]; // overwrite existing flag data
                    } else {
                        this.flagViewHigh[1] = buffer[49];
                    }
                }
            } else {
                this.flagViewLow[1] = buffer[49]; // normal case, just set low flag
            }

            this.lastFlagSetLow = true;
        }
    }

    /**
     * @param {ArrayLike<number>} buffer - buffer.length must be 48, values must be uint8
     */
    setDataLow(buffer) {
        for (let i = 0; i < 48; i++) {
            this.dataViewLow[i] = buffer[i];
        }
        this.lastSetLow = true;
        if (this.buffering) {
            this.buffering = false;
            this.currentLow = true;
        }
    }

    /**
     * @param {ArrayLike<number>} buffer - buffer.length must be 48, values must be uint8
     */
    setDataHigh(buffer) {
        for (let i = 0; i < 48; i++) {
            this.dataViewHigh[i] = buffer[i];
        }
        this.lastSetLow = false;
        if (this.buffering) {
            this.buffering = false;
            this.currentLow = false;
        }
    }
}
