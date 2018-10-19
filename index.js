import React, {Component} from 'react';
import {Animated, Dimensions, Image, PanResponder, View} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';

const DIRECTION = {
    MIDDLE_LEFT: 'MIDDLE_LEFT',
    MIDDLE_RIGHT: 'MIDDLE_RIGHT',
    MIDDLE_TOP: 'MIDDLE_TOP',
    MIDDLE_BOTTOM: 'MIDDLE_BOTTOM',
    MOVE: 'MOVE'
}

const screenWidth = Dimensions.get('window').width;

class CustomCrop extends Component {
    constructor(props) {
        super(props);
        this._forgroundImageRef = null;

        this.state = {
            viewHeight: screenWidth * (props.height / props.width),
            height: props.height,
            width: props.width,
            image: props.initialImage,
            hideStrict: false,
        };
        this.state = {
            ...this.state,
            topLeft: new Animated.ValueXY(
            props.rectangleCoordinates ?
                this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.topLeft, true) :
                {x: 100, y: 100}
        ),
            topRight: new Animated.ValueXY(
            props.rectangleCoordinates ?
                this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.topRight, true) :
                {x: screenWidth - 100, y: 100}
        ),
            bottomLeft: new Animated.ValueXY(
            props.rectangleCoordinates ?
                this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.bottomLeft, true) :
                {x: 100, y: this.state.viewHeight - 100}
        ),
            bottomRight: new Animated.ValueXY(
            props.rectangleCoordinates ?
                this.imageCoordinatesToViewCoordinates(props.rectangleCoordinates.bottomRight, true) :
                {x: screenWidth - 100, y: this.state.viewHeight - 100}
        ),
            imageZoomPanResponder: {panHandlers: {}},
    };

        if (this.props.enableCornerStrict) {
            this.panResponderTopLeft = this.createPanResponser(this.state.topLeft);
            this.panResponderTopRight = this.createPanResponser(this.state.topRight);
            this.panResponderBottomLeft = this.createPanResponser(this.state.bottomLeft);
            this.panResponderBottomRight = this.createPanResponser(this.state.bottomRight);
        }
        this.state = {
            ...this.state,
            middleLeft: new Animated.ValueXY(
            props.rectangleCoordinates ?
                this.imageCoordinatesToViewCoordinates(
                    {
                        x: (props.rectangleCoordinates.topLeft.x + props.rectangleCoordinates.bottomLeft.x) / 2,
                        y: (props.rectangleCoordinates.topLeft.y + props.rectangleCoordinates.bottomLeft.y) / 2,
                    }
                    , true) :
                {x: 100, y: this.state.viewHeight / 2}
        ),
            middleRight: new Animated.ValueXY(
            props.rectangleCoordinates ?
                this.imageCoordinatesToViewCoordinates(
                    {
                        x: (props.rectangleCoordinates.topRight.x + props.rectangleCoordinates.bottomRight.x) / 2,
                        y: (props.rectangleCoordinates.topRight.y + props.rectangleCoordinates.bottomRight.y) / 2,
                    }
                    , true) :
                {x: screenWidth - 100, y: this.state.viewHeight / 2}
        ),
            middleTop: new Animated.ValueXY(
            props.rectangleCoordinates ?
                this.imageCoordinatesToViewCoordinates(
                    {
                        x: (props.rectangleCoordinates.topRight.x + props.rectangleCoordinates.topLeft.x) / 2,
                        y: (props.rectangleCoordinates.topRight.y + props.rectangleCoordinates.topLeft.y) / 2,
                    }
                    , true) :
                {x: screenWidth / 2, y: 100}
        ),
            middleBottom: new Animated.ValueXY(
            props.rectangleCoordinates ?
                this.imageCoordinatesToViewCoordinates(
                    {
                        x: (props.rectangleCoordinates.bottomRight.x + props.rectangleCoordinates.bottomLeft.x) / 2,
                        y: (props.rectangleCoordinates.bottomRight.y + props.rectangleCoordinates.bottomLeft.y) / 2,
                    }
                    , true) :
                {x: screenWidth / 2, y: this.state.viewHeight - 100}
        ),
    }
        this.panResponderMiddleLeft = this.createPanResponser(this.state.middleLeft, DIRECTION.MIDDLE_LEFT);
        this.panResponderMiddleRight = this.createPanResponser(this.state.middleRight, DIRECTION.MIDDLE_RIGHT);
        this.panResponderMiddleTop = this.createPanResponser(this.state.middleTop, DIRECTION.MIDDLE_TOP);
        this.panResponderMiddleBottom = this.createPanResponser(this.state.middleBottom, DIRECTION.MIDDLE_BOTTOM);
        this._imageZoomInfo = {
            positionX: 0,
            positionY: 0,
            scale: 1,
        };

        this._forgroundImagePanResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
            for(let point of this.allPoints) {
                point.setOffset({x: point.x._value, y: point.y._value});
                point.setValue({x: 0, y: 0});
            }
        },
        onPanResponderMove: (evt, gs) => {
            this.updatePoints(DIRECTION.MOVE,gs);
            this.updateForgroundImagePosition();

        },
        onPanResponderRelease: (evt, gs) => {
            for(let point of this.allPoints) {
                point.flattenOffset();
            }
        },
    });

        this.allPoints = [
            this.state.middleBottom,
            this.state.middleTop,
            this.state.middleRight,
            this.state.middleLeft,
            this.state.topLeft,
            this.state.topRight,
            this.state.bottomLeft,
            this.state.bottomRight
        ];
    }

    updateForgroundImagePosition () {
        let _topLeft = this.getAnimatedValueXY(this.state.topLeft);
        this._forgroundImageRef && this._forgroundImageRef.setNativeProps({
            style: {
                top: -(_topLeft.y),
                left: -(_topLeft.x),
            }
        })
    }
    updateForgroundImageSize () {
        let {width, height} = this.getCropSize();
        this._forgroundImageContainerRef && this._forgroundImageContainerRef.setNativeProps({
            style: {
                width,height
            }
        })
    }
    getCropSize() {
        let {topRight, topLeft, bottomRight} = this.state;

        let _topRight = this.getAnimatedValueXY(topRight);
        let _topLeft = this.getAnimatedValueXY(topLeft);
        let _bottomRight = this.getAnimatedValueXY(bottomRight);

        return {
            width: _topRight.x - _topLeft.x,
            height: _bottomRight.y - _topRight.y
        }
    }
    createPanResponser(point, direction = 'point') {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
            point.setOffset({x: point.x._value, y: point.y._value});
            point.setValue({x: 0, y: 0});
        },
        onPanResponderMove: (evt, gs) => {
            if (this.boundaryCheck(direction, gs)) {
                this.updatePoints(direction, gs);
                this.updateForgroundImageSize();
                this.updateForgroundImagePosition();
            }
        },
        onPanResponderRelease: () => {
            point.flattenOffset();
        },
    });
    }

    boundaryCheck(direction, gs) {
        if (direction === DIRECTION.MIDDLE_RIGHT && gs.dx < 0)
            return (this.getCropSize().width) > this.props.minSize;
        else if (direction === DIRECTION.MIDDLE_LEFT && gs.dx > 0)
            return (this.getCropSize().width) > this.props.minSize;
        else if (direction === DIRECTION.MIDDLE_TOP && gs.dy > 0)
            return (this.getCropSize().height) > this.props.minSize;
        else if (direction === DIRECTION.MIDDLE_BOTTOM && gs.dy < 0)
            return (this.getCropSize().height) > this.props.minSize;
        else
            return true;
    }

    viewCoordinatesToImageCoordinates(corner) {
        return {
            x: (this.offsetX(corner.x._value) / screenWidth) * this.state.width,
            y: (this.offsetY(corner.y._value) / this.state.viewHeight) * this.state.height,
        };
    }

    offsetX(x) {
        let maxOffSetX = screenWidth - (screenWidth / this._imageZoomInfo.scale);
        return (x / this._imageZoomInfo.scale) + (maxOffSetX / 2 - this._imageZoomInfo.positionX);
    }

    offsetY(y) {
        let maxOffSetY = this.state.viewHeight - (this.state.viewHeight / this._imageZoomInfo.scale);
        return (y / this._imageZoomInfo.scale) + (maxOffSetY / 2 - this._imageZoomInfo.positionY);
    }

    getCropData() {
        const coordinates = {
            topLeft: this.viewCoordinatesToImageCoordinates(this.state.topLeft),
            topRight: this.viewCoordinatesToImageCoordinates(this.state.topRight),
            bottomLeft: this.viewCoordinatesToImageCoordinates(this.state.bottomLeft),
            bottomRight: this.viewCoordinatesToImageCoordinates(this.state.bottomRight),
        };
        return ({
            offset: {
                x: parseInt(coordinates.topLeft.x),
                y: parseInt(coordinates.topLeft.y),
            },
            size: {
                width: parseInt(Math.abs(coordinates.topRight.x - coordinates.topLeft.x)),
                height: parseInt(Math.abs(coordinates.topLeft.y - coordinates.bottomLeft.y)),
            }
        });
    }

    updatePoints(direction, gs) {
        if (direction === DIRECTION.MIDDLE_LEFT) {
            this.state.middleLeft.setValue({x: gs.dx, y: 0});
            this.state.topLeft.setValue({
                x: this.state.middleLeft.x._value + this.state.middleLeft.x._offset,
                y: this.state.topLeft.y._value
            });
            this.state.bottomLeft.setValue({
                x: this.state.middleLeft.x._value + this.state.middleLeft.x._offset,
                y: this.state.bottomLeft.y._value
            });
            this.state.middleTop.setValue({
                x: (this.state.topLeft.x._value + this.state.topRight.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.topRight.y._value) / 2,
            });
            this.state.middleBottom.setValue({
                x: (this.state.bottomLeft.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.bottomLeft.y._value + this.state.bottomRight.y._value) / 2,
            });

        } else if (direction === DIRECTION.MIDDLE_RIGHT) {
            this.state.middleRight.setValue({x: gs.dx, y: 0});
            this.state.topRight.setValue({
                x: this.state.middleRight.x._value + this.state.middleRight.x._offset,
                y: this.state.topRight.y._value
            });
            this.state.bottomRight.setValue({
                x: this.state.middleRight.x._value + this.state.middleRight.x._offset,
                y: this.state.bottomRight.y._value
            });
            this.state.middleTop.setValue({
                x: (this.state.topLeft.x._value + this.state.topRight.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.topRight.y._value) / 2,
            });
            this.state.middleBottom.setValue({
                x: (this.state.bottomLeft.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.bottomLeft.y._value + this.state.bottomRight.y._value) / 2,
            });
        } else if (direction === DIRECTION.MIDDLE_TOP) {
            this.state.middleTop.setValue({x: 0, y: gs.dy});
            this.state.topLeft.setValue({
                x: this.state.topLeft.x._value,
                y: this.state.middleTop.y._value + this.state.middleTop.y._offset,
            });
            this.state.topRight.setValue({
                x: this.state.topRight.x._value,
                y: this.state.middleTop.y._value + this.state.middleTop.y._offset,
            });
            this.state.middleLeft.setValue({
                x: (this.state.topLeft.x._value + this.state.bottomLeft.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.bottomLeft.y._value) / 2,
            });
            this.state.middleRight.setValue({
                x: (this.state.topRight.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.topRight.y._value + this.state.bottomRight.y._value) / 2,
            });
        } else if (direction === DIRECTION.MIDDLE_BOTTOM) {
            this.state.middleBottom.setValue({x: 0, y: gs.dy});
            this.state.bottomLeft.setValue({
                x: this.state.topLeft.x._value,
                y: this.state.middleBottom.y._value + this.state.middleBottom.y._offset
            });
            this.state.bottomRight.setValue({
                x: this.state.topRight.x._value,
                y: this.state.middleBottom.y._value + this.state.middleBottom.y._offset
            });
            this.state.middleLeft.setValue({
                x: (this.state.topLeft.x._value + this.state.bottomLeft.x._value) / 2,
                y: (this.state.topLeft.y._value + this.state.bottomLeft.y._value) / 2,
            });
            this.state.middleRight.setValue({
                x: (this.state.topRight.x._value + this.state.bottomRight.x._value) / 2,
                y: (this.state.topRight.y._value + this.state.bottomRight.y._value) / 2,
            });
        } else if (direction === DIRECTION.MOVE) {
            this.state.topLeft.setValue({x: gs.dx, y: gs.dy});
            this.state.topRight.setValue({x: gs.dx, y: gs.dy});
            this.state.bottomLeft.setValue({x: gs.dx, y: gs.dy});
            this.state.bottomRight.setValue({x: gs.dx, y: gs.dy});
            this.state.middleLeft.setValue({x: gs.dx, y: gs.dy});
            this.state.middleRight.setValue({x: gs.dx, y: gs.dy});
            this.state.middleTop.setValue({x: gs.dx, y: gs.dy});
            this.state.middleBottom.setValue({x: gs.dx, y: gs.dy});
        }
    }

    imageCoordinatesToViewCoordinates(corner) {
        return {
            x: (corner.x * screenWidth) / this.state.width,
            y: (corner.y * this.state.viewHeight) / this.state.height,
        };
    }





    getAnimatedValueXY(a) {
        return {
            x: (a.x._value + a.x._offset),
            y: (a.y._value + a.y._offset),
        }
    }

    static defaultProps = {
        handlerColor: 'blue',
        handlerHorizontalWidth: 40,
        handlerHorizontalHeight: 10,
        minSize: 40 * 3,
        bgImageOpacity: 0.5,
        overlayStrokeColor: "blue",
        overlayStrokeWidth: 0.5,
    };

    render() {
        return (
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'flex-end'}}>
    <View style={[s(this.props).cropContainer, {height: this.state.viewHeight}]}>
    <ImageZoom cropWidth={screenWidth}
        cropHeight={this.state.viewHeight}
        imageWidth={screenWidth}
        imageHeight={this.state.viewHeight}
        onPanResponderCreated={(panResponder) => {
            this.setState({imageZoomPanResponder: panResponder})
        }}
        onMove={(obj) => {
            this._imageZoomInfo = obj;
            this._forgroundImageRef && this._forgroundImageRef.setNativeProps({
                style: {
                    transform: [
                        {
                            scale: this._imageZoomInfo.scale
                        },
                        {
                            translateX: this._imageZoomInfo.positionX
                        },
                        {
                            translateY: this._imageZoomInfo.positionY
                        }
                    ]
                }
            })
        }}
        maxScale={3}>
            <Image
        style={[s(this.props).image, {height: this.state.viewHeight}, {opacity: this.props.bgImageOpacity}]}
        resizeMode="contain"
        source={{uri: this.state.image}}
        />
        </ImageZoom>

        <Animated.View renderToHardwareTextureAndroid
        ref={(ref) => ref && (this._forgroundImageContainerRef = ref)}
        style={[
                this.state.topLeft.getLayout(),
        {width: this.getCropSize().width},
        {height: this.getCropSize().height},
        {position: "absolute", backgroundColor: "transparent", overflow: 'hidden'},
        {
            borderWidth: this.props.overlayStrokeWidth,
                borderColor: this.props.overlayStrokeColor,
            //borderStyle:'dashed',
            //borderRadius: 0.1
        }
    ]}
        {...this._forgroundImagePanResponder.panHandlers}>
    <Animated.Image
        ref={(ref) => ref && (this._forgroundImageRef = ref)}
        style={[
                s(this.props).image,
        {position: 'absolute', overflow: 'hidden'},
        {height: this.state.viewHeight},
        {opacity: 1},
        {top: -(this.state.topLeft.y._value)},
        {left: -(this.state.topLeft.x._value)},
        {transform: [
            {
                scale: this._imageZoomInfo.scale
            },
            {
                translateX: this._imageZoomInfo.positionX
            },
            {
                translateY: this._imageZoomInfo.positionY
            }
        ]
        }
    ]}
        resizeMode="cover"
        source={{uri: this.state.image}}
        />
        </Animated.View>

        {this.props.enableCornerStrict && !this.state.hideStrict &&
        <Animated.View
            {...this.panResponderTopLeft.panHandlers}
            style={[this.state.topLeft.getLayout(), s(this.props).handler]}>
        <View style={[s(this.props).handlerI, {left: -10, top: -10}]}/>
        <View style={[s(this.props).handlerRound, {left: 31, top: 31}]}/>
        </Animated.View>
        }
        {this.props.enableCornerStrict && !this.state.hideStrict &&
        <Animated.View
            {...this.panResponderTopRight.panHandlers}
            style={[this.state.topRight.getLayout(), s(this.props).handler]}>
        <View style={[s(this.props).handlerI, {left: 10, top: -10}]}/>
        <View style={[s(this.props).handlerRound, {right: 31, top: 31}]}/>
        </Animated.View>
        }
        {this.props.enableCornerStrict && !this.state.hideStrict &&
        <Animated.View
            {...this.panResponderBottomLeft.panHandlers}
            style={[this.state.bottomLeft.getLayout(), s(this.props).handler]}>
        <View style={[s(this.props).handlerI, {left: -10, top: 10}]}/>
        <View style={[s(this.props).handlerRound, {left: 31, bottom: 31}]}/>
        </Animated.View>
        }
        {this.props.enableCornerStrict && !this.state.hideStrict &&
        <Animated.View
            {...this.panResponderBottomRight.panHandlers}
            style={[this.state.bottomRight.getLayout(), s(this.props).handler]}>
        <View style={[s(this.props).handlerI, {left: 10, top: 10}]}/>
        <View style={[s(this.props).handlerRound, {right: 31, bottom: 31}]}/>
        </Animated.View>
        }


        {!this.state.hideStrict &&
        <Animated.View
            {...this.panResponderMiddleLeft.panHandlers}
            hitSlop={{top: 20, left: 30, bottom: 20, right: 30}}
            style={[this.state.middleLeft.getLayout(), s(this.props).handlerVertical]}>
        <View style={[s(this.props).handlerRectVertical]}/>
        </Animated.View>
        }
        {!this.state.hideStrict &&
        <Animated.View
            {...this.panResponderMiddleRight.panHandlers}
            hitSlop={{top: 20, left: 30, bottom: 20, right: 30}}
            style={[this.state.middleRight.getLayout(), s(this.props).handlerVertical]}>
        <View style={[s(this.props).handlerRectVertical]}/>
        </Animated.View>
        }
        {!this.state.hideStrict &&
        <Animated.View
            {...this.panResponderMiddleTop.panHandlers}
            hitSlop={{top: 30, left: 20, bottom: 30, right: 20}}
            style={[this.state.middleTop.getLayout(), s(this.props).handlerHorizontal]}>
        <View style={[s(this.props).handlerRectHorizontal]}/>
        </Animated.View>
        }
        {!this.state.hideStrict &&
        <Animated.View
            {...this.panResponderMiddleBottom.panHandlers}
            hitSlop={{top: 30, left: 20, bottom: 30, right: 20}}
            style={[this.state.middleBottom.getLayout(), s(this.props).handlerHorizontal]}>
        <View style={[s(this.props).handlerRectHorizontal]}/>
        </Animated.View>
        }
    </View>
        </View>
    );
    }


}


const s = (props) => {
    return {
        handlerI: {
            borderRadius: 0,
            height: 20,
            width: 20,
            backgroundColor: props.handlerColor,
        },
        handlerRound: {
            width: 39,
            position: 'absolute',
            height: 39,
            borderRadius: 100,
            backgroundColor: props.handlerColor,
        },
        handlerHorizontal: {
            width: props.handlerHorizontalWidth,
            height: props.handlerHorizontalHeight,
            overflow: 'visible',
            position: 'absolute',
            marginTop: -(props.handlerHorizontalHeight / 2),
            marginLeft: -(props.handlerHorizontalWidth / 2),
        },
        handlerVertical: {
            width: props.handlerHorizontalHeight,
            height: props.handlerHorizontalWidth,
            overflow: 'visible',
            position: 'absolute',
            marginTop: -(props.handlerHorizontalWidth / 2),
            marginLeft: -(props.handlerHorizontalHeight / 2),
        },
        handlerRectHorizontal: {
            position: 'absolute',
            width: props.handlerHorizontalWidth,
            height: props.handlerHorizontalHeight,
            backgroundColor: props.handlerColor,
        },
        handlerRectVertical: {
            position: 'absolute',
            width: props.handlerHorizontalHeight,
            height: props.handlerHorizontalWidth,
            backgroundColor: props.handlerColor,
        },
        image: {
            width: screenWidth,
            position: 'absolute',
        },
        handler: {
            height: 0,
            width: 0,
            overflow: 'visible',
            position: 'absolute',
        },
        cropContainer: {
            position: 'absolute',
            left: 0,
            width: screenWidth,
            top: 0,
        }
    };
};

export default CustomCrop;
